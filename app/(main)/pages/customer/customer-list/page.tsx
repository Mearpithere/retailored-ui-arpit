/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ToggleButton } from 'primereact/togglebutton';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { UserService } from '@/demo/service/user.service';
import { Skeleton } from 'primereact/skeleton';
import { useRef } from 'react';
import { Calendar } from 'primereact/calendar';
import { RadioButton } from 'primereact/radiobutton';
import FullPageLoader from '@/demo/components/FullPageLoader';
import { useInfiniteObserver } from '@/demo/hooks/useInfiniteObserver';
import { useDebounce } from 'use-debounce';
import { Demo } from '@/types';
import { Toast } from '@capacitor/toast';

const CustomerList = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 1000);
  const [customers, setCustomers] = useState<Demo.User[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [originalCustomer, setOriginalCustomer] = useState<Demo.User | null>(null);
  const [currentCustomer, setCurrentCustomer] = useState<Demo.User | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isMaximized, setIsMaximized] = useState(true);
  const [paginatorInfo, setPaginatorInfo] = useState<Demo.PaginatorInfo | null>(null);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [page, setPage] = useState(1);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchCustomers = async (loadMore = false) => {
    try {
      if (loadMore) {
        setIsLoadingMore(true);
      } else if (!searchTerm) {
        setIsInitialLoading(true);
      }
      
      const { data, paginatorInfo } = await UserService.getUsers(
        debouncedSearchTerm,
        20,
        loadMore ? page + 1 : 1
      );

      const mappedCustomers = data
        .filter(user => user.isCustomer === 'Y')
        .map((user) => ({
          id: user.id,
          fname: user.fname || '',
          lname: user.lname || '',
          mobileNumber: user.mobileNumber,
          alternateContact: user.alternateContact || '',
          email: user.email,
          dob: user.dob,
          anniversary: user.anniversary || '',
          gender: user.gender,
          active: user.active,
        }));

      setCustomers(prev => loadMore ? [...prev, ...mappedCustomers] : mappedCustomers);
      setPaginatorInfo(paginatorInfo);
      setHasMorePages(paginatorInfo.hasMorePages);
      if (loadMore) setPage(prev => prev + 1);
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setError('Failed to load customers. Please try again.');
      await Toast.show({
        text: 'Failed to load customers',
        duration: 'short',
        position: 'bottom'
      });
    } finally {
      setIsInitialLoading(false);
      setIsLoadingMore(false);
      setListLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchCustomers();
  }, [debouncedSearchTerm]);

  useInfiniteObserver({
    targetRef: observerTarget,
    hasMorePages,
    isLoading: isLoadingMore,
    onIntersect: () => {
      if (hasMorePages) {
        fetchCustomers(true);
      }
    },
    deps: [hasMorePages, searchTerm]
  });

  const handleCardClick = (customerId: string) => {
    router.push(`/pages/customer/customer-details?id=${customerId}`);
  };

  const showAddDialog = () => {
    setCurrentCustomer({
      id: Date.now().toString(),
      fname: '',
      lname: '',
      mobileNumber: '',
      alternateContact: '',
      email: '',
      dob: '',
      anniversary: '',
      gender: 'M',
      active: 1
    });
    setIsEditMode(false);
    setVisible(true);
  };

  const showEditDialog = (customer: Demo.User) => {
    setCurrentCustomer({ ...customer });
    setOriginalCustomer(customer);
    setIsEditMode(true);
    setVisible(true);
  };

  const isFormValid = () => {
    return (
      currentCustomer?.fname?.trim() &&
      currentCustomer?.mobileNumber?.trim()?.length === 10 &&
      currentCustomer?.gender
    );
  };

  const handleSave = async () => {
    if (!currentCustomer) return;

    setListLoading(true);
    try {
      if (isEditMode && originalCustomer) {
        const payload: Partial<Demo.UpdateUserInput> = {};
    
        if (currentCustomer.fname !== originalCustomer.fname) payload.fname = currentCustomer.fname;
        if (currentCustomer.lname !== originalCustomer.lname) payload.lname = currentCustomer.lname || '';
        if (currentCustomer.email !== originalCustomer.email) payload.email = currentCustomer.email || '';
        if (currentCustomer.mobileNumber !== originalCustomer.mobileNumber) payload.mobileNumber = currentCustomer.mobileNumber;
        if (currentCustomer.alternateContact !== originalCustomer.alternateContact) payload.alternateContact = currentCustomer.alternateContact || '';
        if (currentCustomer.dob !== originalCustomer.dob) payload.dob = currentCustomer.dob || '';
        if (currentCustomer.anniversary !== originalCustomer.anniversary) payload.anniversary = currentCustomer.anniversary || '';
        if (currentCustomer.gender !== originalCustomer.gender) payload.gender = currentCustomer.gender;
        if (currentCustomer.active !== originalCustomer.active) payload.active = currentCustomer.active ?? 1;
    
        const finalPayload = { ...payload };
    
        const updatedUser = await UserService.updateUser(currentCustomer.id, finalPayload);
        setCustomers(customers.map(c => c.id === updatedUser.id ? updatedUser : c));

        await Toast.show({
          text: 'Customer updated successfully',
          duration: 'short',
          position: 'bottom'
        });
      } else {
        const payload = {
          fname: currentCustomer.fname,
          lname: currentCustomer.lname || '',
          email: currentCustomer.email || null,
          mobileNumber: currentCustomer.mobileNumber,
          alternateContact: currentCustomer.alternateContact || null,
          dob: currentCustomer.dob || null,
          anniversary: currentCustomer.anniversary || null,
          gender: currentCustomer.gender,
          active: currentCustomer.active ?? 1,
          isCustomer: "Y",
          rlcode: 1,
          cmpcode: 1,
          user_type: "E",
          ext: "N"
        };
    
        const newCustomer = await UserService.createUser(payload);
        setCustomers([...customers, newCustomer]);
        await Toast.show({
          text: 'Customer created successfully',
          duration: 'short',
          position: 'bottom'
        });
      }
    
      setVisible(false);
      fetchCustomers();
    } catch (err: any) {
      const errorMessage = err?.message || 'Error saving customer';
      await Toast.show({
        text: errorMessage,
        duration: 'short',
        position: 'bottom'
      });
      console.error('Error:', err);
    } finally {
      setListLoading(false);
    }
  };
  
  const confirmStatusChange = async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const newStatus = customer.active === 1 ? 0 : 1;
    const statusText = newStatus === 1 ? 'activate' : 'deactivate';

    confirmDialog({
      message: `Are you sure you want to ${statusText} this customer?`,
      header: 'Confirm Status Change',
      icon: 'pi pi-info-circle',
      acceptClassName: newStatus === 1 ? 'p-button-success' : 'p-button-danger',
      accept: async () => {
        try {
          setListLoading(true);
          await UserService.updateUser(customerId, { active: newStatus });
          fetchCustomers();
          await Toast.show({
            text: `Customer ${statusText}d successfully`,
            duration: 'short',
            position: 'bottom'
          });
        } catch (err: any) {
          const errorMessage = err?.message || 'Failed to update customer status';
          await Toast.show({
            text: errorMessage,
            duration: 'short',
            position: 'bottom'
          });
          console.error('Error:', err);
        } finally {
          setListLoading(false);
        }
      }
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const footerContent = (
    <div className="mt-3">
      <Button label="Cancel" icon="pi pi-times" onClick={() => setVisible(false)} className="p-button-text" />
      <Button label="Save" icon="pi pi-check" onClick={handleSave} disabled={!isFormValid()} />
    </div>
  );
  
  if (isInitialLoading || error) {
    return (
      <div className="flex flex-column p-3 lg:p-5" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-4 gap-3 w-full">
          <Skeleton width="10rem" height="1.5rem" />
          <Skeleton width="100%" height="2rem" className="md:w-20rem" />
          <Skeleton width="100%" height="2rem" />
        </div>

        <div className="flex flex-wrap gap-3 lg:justify-content-start">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="flex flex-column w-full sm:w-12rem md:w-16rem lg:w-20rem xl:w-22rem">
              <div className="flex justify-content-between align-items-start mb-3">
                <div className="flex flex-column gap-2">
                  <Skeleton width="12rem" height="1.5rem" />
                  <Skeleton width="10rem" height="1rem" />
                  <Skeleton width="10rem" height="1rem" />
                  <Skeleton width="14rem" height="1rem" />
                  <Skeleton width="10rem" height="1rem" />
                </div>
                <Skeleton width="4.5rem" height="1.5rem" />
              </div>

              <div className="flex justify-content-end gap-2 mt-3">
                <Skeleton shape="circle" size="2rem" />
                <Skeleton shape="circle" size="2rem" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {listLoading && <FullPageLoader />}
      <div className="flex flex-column p-3 lg:p-5" style={{ maxWidth: '1200px', margin: '0 auto' }}>        
        <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-4 gap-3">
          <h2 className="text-2xl m-0">Customers</h2>
          <span className="p-input-icon-left p-input-icon-right w-full">
            <i className="pi pi-search" />
            <InputText 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search"
              className="w-full"
            />

            {listLoading && debouncedSearchTerm ? (
              <i className="pi pi-spin pi-spinner" />
            ) : searchTerm ? (
              <i 
                className="pi pi-times cursor-pointer" 
                onClick={() => {
                  setSearchTerm('');
                }}
              />
            ) : null}
          </span>
          <Button 
            label="Add Customer" 
            icon="pi pi-plus" 
            onClick={showAddDialog}
            className="w-full md:w-auto"
            size="small"
          />
        </div>

        <div className="flex flex-wrap gap-3 lg:justify-content-start">
          {customers.length > 0 ? (
            <>
              {customers.map((customer) => (
                customer && ( 
                  <Card 
                    key={customer.id} 
                    className="flex flex-column w-full sm:w-12rem md:w-16rem lg:w-20rem xl:w-22rem transition-all transition-duration-200 hover:shadow-4 cursor-pointer"
                    onClick={() => handleCardClick(customer.id)}
                  >
                    <div className="flex justify-content-between align-items-start mb-3">
                      <div>
                        <h3 className="text-xl m-0">{customer?.fname} {customer?.lname}</h3>

                        <div className="text-sm text-500 flex flex-wrap align-items-center gap-2 mt-2">
                          <i className="pi pi-phone" /> {customer.mobileNumber}
                          {customer.alternateContact && (
                            <span className="text-sm text-500 flex align-items-center gap-2">
                              (Alt: {customer.alternateContact})
                            </span>
                          )}
                        </div>

                        {customer.email && (
                          <div className="text-sm text-500 flex flex-wrap align-items-center gap-2 mt-2">
                            <i className="pi pi-envelope" /> {customer.email}
                          </div>
                        )}

                        <div className="text-sm text-500 flex flex-wrap align-items-center gap-2 mt-2">
                          <i className="pi pi-calendar" /> DOB: {formatDate(customer.dob)}
                        </div>

                        {customer.anniversary && (
                          <div className="text-sm text-500 flex flex-wrap align-items-center gap-2 mt-2">
                            <i className="pi pi-heart" /> Anniversary: {formatDate(customer.anniversary)}
                          </div>
                        )}

                        <div className="text-sm text-500 flex flex-wrap align-items-center gap-2 mt-2">
                          <i className="pi pi-user" /> {customer.gender === 'M' ? 'Male' : 'Female'}
                        </div>
                      </div>

                      <Tag 
                        value={customer.active === 1 ? 'Active' : 'Inactive'}
                        severity={customer.active === 1 ? 'success' : 'danger'}
                        className="align-self-start"
                      />
                    </div>

                    <div className="flex justify-content-end gap-1">
                      <Button 
                        icon="pi pi-pencil" 
                        rounded 
                        text 
                        onClick={(e) => {
                          e.stopPropagation();
                          showEditDialog(customer);
                        }}
                        severity="secondary"
                      />
                      <Button 
                        icon={customer.active === 1 ? 'pi pi-trash' : 'pi pi-replay'} 
                        rounded 
                        text 
                        severity={customer.active === 1 ? 'danger' : 'success'}
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmStatusChange(customer.id);
                        }}
                      />
                    </div>
                  </Card>
                )
              ))}
              <div ref={observerTarget} className="w-full flex justify-content-center p-3">
                {isLoadingMore && (
                  <div className="flex align-items-center gap-2">
                    <i className="pi pi-spinner pi-spin" />
                    <span>Loading more data...</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="w-full p-4 text-center surface-100 border-round">
              <i className="pi pi-search text-4xl mb-2" />
              <h3>No customers found</h3>
              {searchTerm && (
                <Button 
                  label="Clear search" 
                  className="mt-3" 
                  onClick={() => setSearchTerm('')}
                  size="small"
                />
              )}
            </div>
          )}
        </div>

        <Dialog 
          header={isEditMode ? "Edit Customer" : "Add New Customer"} 
          visible={visible} 
          onHide={() => setVisible(false)}
          maximized={isMaximized}
          onMaximize={(e) => setIsMaximized(e.maximized)}
          className={isMaximized ? 'maximized-dialog' : ''}
          blockScroll
          footer={footerContent}
        >
          {currentCustomer && (
              <div className="p-fluid grid mt-2">
                  <div className="col-12">
                      <small className="text-color-secondary">
                          Fields marked with <span className="text-red-500 font-bold">*</span> are required
                      </small>
                  </div>
                  <div className="field col-12 md:col-6">
                      <div className="flex align-items-center gap-1 mb-2">
                          <label htmlFor="fname">First Name</label>
                          <span className="text-red-500 font-bold">*</span>
                      </div>
                      <InputText 
                          id="fname" 
                          value={currentCustomer.fname} 
                          onChange={(e) => setCurrentCustomer({...currentCustomer, fname: e.target.value})}
                          placeholder="Enter first name"
                          required
                      />
                  </div>
                  
                  <div className="field col-12 md:col-6">
                      <label htmlFor="lname">Last Name</label>
                      <InputText 
                          id="lname" 
                          value={currentCustomer.lname || ''} 
                          onChange={(e) => setCurrentCustomer({...currentCustomer, lname: e.target.value})}
                          placeholder="Enter last name"
                      />
                  </div>
                  
                  <div className="field col-12 md:col-6">
                      <div className="flex align-items-center gap-1 mb-2">
                          <label htmlFor="mobileNumber">Mobile Number</label>
                          <span className="text-red-500 font-bold">*</span>
                      </div>
                      <InputText 
                          id="mobileNumber" 
                          type="tel"
                          inputMode="numeric"
                          value={currentCustomer.mobileNumber} 
                          onChange={(e) => setCurrentCustomer({...currentCustomer, mobileNumber: e.target.value})}
                          placeholder="Enter 10-digit mobile number"
                          required
                      />
                  </div>
                  
                  <div className="field col-12 md:col-6">
                      <label htmlFor="alternateContact">Alternate Contact</label>
                      <InputText 
                          id="alternateContact" 
                          value={currentCustomer.alternateContact || ''} 
                          onChange={(e) => setCurrentCustomer({...currentCustomer, alternateContact: e.target.value})}
                          placeholder="Alternate phone number"
                      />
                  </div>
                  
                  <div className="field col-12 md:col-6">
                      <div className="flex align-items-center gap-1 mb-2">
                          <label htmlFor="email">Email</label>
                      </div>
                      <InputText 
                          id="email" 
                          value={currentCustomer.email || ''} 
                          onChange={(e) => setCurrentCustomer({...currentCustomer, email: e.target.value})}
                          placeholder="example@domain.com"
                      />
                  </div>
                  
                  <div className="field col-12 md:col-6">
                      <div className="flex align-items-center gap-1 mb-2">
                          <label htmlFor="dob">Date of Birth</label>
                      </div>
                      <Calendar
                          id="dob"
                          value={currentCustomer.dob ? new Date(currentCustomer.dob) : null}
                          onChange={(e) => setCurrentCustomer({
                              ...currentCustomer,
                              dob: e.value?.toISOString().split('T')[0] || ''
                          })}
                          placeholder="Select date of birth"
                          dateFormat="dd/mm/yy"
                          showIcon
                      />
                  </div>
                  
                  <div className="field col-12 md:col-6">
                      <label htmlFor="anniversary">Anniversary</label>
                      <Calendar
                          id="anniversary"
                          value={currentCustomer.anniversary ? new Date(currentCustomer.anniversary) : null}
                          onChange={(e) => setCurrentCustomer({
                              ...currentCustomer,
                              anniversary: e.value?.toISOString().split('T')[0] || ''
                          })}
                          placeholder="Select anniversary date"
                          dateFormat="dd/mm/yy"
                          showIcon
                      />
                  </div>
                  
                  <div className="field col-12 md:col-6">
                      <div className="flex align-items-center gap-1 mb-2">
                          <label>Gender</label>
                          <span className="text-red-500 font-bold">*</span>
                      </div>
                      <div className="flex align-items-center gap-3 mt-2">
                          <div className="flex align-items-center">
                              <RadioButton
                                  inputId="male"
                                  name="gender"
                                  value="M"
                                  onChange={(e) => setCurrentCustomer({...currentCustomer, gender: e.value})}
                                  checked={currentCustomer.gender === 'M'}
                              />
                              <label htmlFor="male" className="ml-2">Male</label>
                          </div>
                          <div className="flex align-items-center">
                              <RadioButton
                                  inputId="female"
                                  name="gender"
                                  value="F"
                                  onChange={(e) => setCurrentCustomer({...currentCustomer, gender: e.value})}
                                  checked={currentCustomer.gender === 'F'}
                              />
                              <label htmlFor="female" className="ml-2">Female</label>
                          </div>
                      </div>
                  </div>
                  
                  <div className="field col-12">
                    <div className="flex align-items-center gap-1 mb-2">
                        <label htmlFor="status">Status</label>
                        <span className="text-red-500 font-bold">*</span>
                    </div>
                    <ToggleButton
                        id="status"
                        onLabel="Active"
                        offLabel="Inactive"
                        onIcon="pi pi-check"
                        offIcon="pi pi-times"
                        checked={currentCustomer.active === 1}
                        onChange={(e) =>
                            setCurrentCustomer({
                                ...currentCustomer,
                                active: e.value ? 1 : 0,
                            })
                        }
                        className="w-full md:w-10rem"
                    />
                </div>
              </div>
          )}
        </Dialog>
        <ConfirmDialog />
      </div>
    </>
  );
};

export default CustomerList;