/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Skeleton } from 'primereact/skeleton';
import { InputText } from 'primereact/inputtext';
import { MaterialService } from '@/demo/service/material.service';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import FullPageLoader from '@/demo/components/FullPageLoader';
import { useInfiniteObserver } from '@/demo/hooks/useInfiniteObserver';
import { useDebounce } from 'use-debounce';
import { Demo } from '@/types';
import { Toast } from '@capacitor/toast';

type Measurement = {
  id?: number;
  measurement_name: string;
  data_type: 'text' | 'number';
  seq: number;
};

interface Process {
  id: number;
  type_id?: number;
  name: string;
  price: number;
  job_or_sales: string;
};

interface ProcessType {
  id: number;
  type_name: string;
}

interface ProcessOption {
  id: number;
  label: string;
  value: string;
  job_or_sales: string;
  original_name?: string;
}

type Ext = 'N' | 'Y';

interface PriceChartItem {
  id: string;
  material_id: string;
  job_or_sales: string;
  price: number;
  type: ProcessType;
  ext: Ext;
}

interface Garment {
  id: number;
  name: string;
  image_url: string[];
  measurements: Measurement[];
  processes?: Process[];
  priceChart?: PriceChartItem[];
  ext: Ext;
};

interface StatusOption {
  label: string;
  value: Ext;
  icon: string;
};

const statusOptions: StatusOption[] = [
  { label: 'Active', value: 'N', icon: 'pi pi-check-circle' },
  { label: 'Inactive', value: 'Y', icon: 'pi pi-times-circle' }
];

const Products = () => {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 1000);
  const [isMaximized, setIsMaximized] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMeasurementIndex, setEditMeasurementIndex] = useState<number | null>(null);
  const [paginatorInfo, setPaginatorInfo] = useState<Demo.PaginatorInfo | null>(null);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [processOptions, setProcessOptions] = useState<ProcessOption[]>([]);
  const [isAddingProcess, setIsAddingProcess] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<string>('');
  const [processPrice, setProcessPrice] = useState<number>(0);
  const [currentGarment, setCurrentGarment] = useState<Garment>({
    id: 0,
    name: '',
    image_url: [],
    measurements: [],
    ext: 'N'
  });
  const [newMeasurement, setNewMeasurement] = useState<Omit<Measurement, 'seq'>>({
    id: 0,
    measurement_name: '',
    data_type: 'number',
  });
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchMaterials = async (loadMore = false) => {
    try {
      if (loadMore) {
        setIsLoadingMore(true);
      } else if (!searchTerm) {
        setIsInitialLoading(true);
      }

      const { data, paginatorInfo } = await MaterialService.getMaterialMasters(
        debouncedSearchTerm,
        20,
        loadMore ? page + 1 : 1
      );

      const mappedGarments = data.map((material: any) => ({
        id: Number(material.id),
        name: material.name,
        image_url: material.img_url || [],
        measurements: material.measurements.map((m: Measurement) => ({
          id: Number(m.id),
          measurement_name: m.measurement_name,
          data_type: m.data_type,
          seq: m.seq ?? 0
        })),
        priceChart: material.priceChart?.map((pc: any) => ({
        ...pc,
        type: {
          id: Number(pc.type?.id),
          type_name: pc.type?.type_name || ''
        }
      })) || [],
        ext: material.ext as Ext
      }));

      setGarments(prev => loadMore ? [...prev, ...mappedGarments] : mappedGarments);
      setPaginatorInfo(paginatorInfo);
      setHasMorePages(paginatorInfo.hasMorePages);
      if (loadMore) setPage(prev => prev + 1);
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to fetch products. Please try again.');
      await Toast.show({
        text: 'Failed to fetch products',
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
    fetchMaterials();
  }, [debouncedSearchTerm]);

  useInfiniteObserver({
    targetRef: observerTarget,
    hasMorePages,
    isLoading: isLoadingMore,
    onIntersect: () => {
      if (hasMorePages) {
        fetchMaterials(true);
      }
    },
    deps: [hasMorePages, searchTerm]
  });

  const getProcessedOrderTypes = async () => {
    const { data } = await MaterialService.getOrderTypes();
    
    return data.map((orderType: any) => ({
      label: `${orderType.type_name} - ${orderType.job_or_sales}`,
      value: `${orderType.type_name} - ${orderType.job_or_sales}`,
      id: orderType.id,
      job_or_sales: orderType.job_or_sales,
      original_name: orderType.type_name
    }));
  };

  const handleAdd = async () => {
    const options = await getProcessedOrderTypes();

    setCurrentGarment({
      id: 0,
      name: '',
      image_url: [],
      measurements: [],
      processes: [],
      ext: 'N'
    });
    setNewMeasurement({
      measurement_name: '',
      data_type: 'number'
    });
    setProcessOptions(options);
    setSelectedProcess('');
    setProcessPrice(0);
    setEditMode(false);
    setShowDialog(true);
  };

  const handleEdit = async (garment: Garment) => {
    const allOptions = await getProcessedOrderTypes();

    const processes = garment.priceChart?.map((priceItem: PriceChartItem) => {
      const typeName = priceItem.type?.type_name || `Process ${priceItem.type.id}`;
      const name = `${typeName} - ${priceItem.job_or_sales}`;

      return {
        id: Number(priceItem.id),
        type_id: Number(priceItem.type.id),
        name: name,
        price: Number(priceItem.price),
        job_or_sales: priceItem.job_or_sales
      };
    }) || [];

    const usedProcesses = processes.map((p: Process) => p.name);

    setCurrentGarment({ 
      ...garment,
      image_url: garment.image_url || [],
      processes: processes
    });
    
    setProcessOptions(allOptions.filter(opt => !usedProcesses.includes(opt.value)));
    
    setSelectedProcess('');
    setProcessPrice(0);
    setEditMode(true);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!currentGarment.name) {
      await Toast.show({
        text: 'Product name is required',
        duration: 'short',
        position: 'bottom'
      });
      return;
    }

    if (currentGarment.measurements.length === 0) {
      await Toast.show({
        text: 'At least one measurement is required',
        duration: 'short',
        position: 'bottom'
      });
      return;
    }

    setListLoading(true);
    try {
      const mapProcessesToPriceChart = (processes: Process[] | undefined, isUpdate: boolean) => {
        return processes?.map(process => {
          const baseItem = {
            type_id: Number(process.type_id),
            job_or_sales: process.job_or_sales,
            price: Number(process.price)
          };
          
          if (isUpdate && process.id) {
            return {
              ...baseItem,
              id: Number(process.id)
            };
          }
          return baseItem;
        }) || [];
      };

      if (editMode) {
        const payload = {
          name: currentGarment.name,
          image_url: currentGarment.image_url,
          ext: currentGarment.ext,
          measurements: currentGarment.measurements,
          priceChart: mapProcessesToPriceChart(currentGarment.processes, true)
        };

        await MaterialService.updateMaterialWithMeasurements(String(currentGarment.id), payload);
        await Toast.show({
          text: 'Product updated successfully',
          duration: 'short',
          position: 'bottom'
        });
      } else {
        const payload = {
          name: currentGarment.name,
          image_url: currentGarment.image_url || [],
          material_type: 'F',
          isSaleable: 'Y',
          wsp: 0,
          mrp: 0,
          vendor_id: 2,
          ext: currentGarment.ext,
          measurements: currentGarment.measurements,
          priceChart: mapProcessesToPriceChart(currentGarment.processes, false)
        };

        await MaterialService.createMaterialWithMeasurements(payload);
        await Toast.show({
          text: 'Product created successfully',
          duration: 'short',
          position: 'bottom'
        });
      }  

      setShowDialog(false);
      fetchMaterials();
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to save product';
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

  const addMeasurement = async () => {
    const trimmedName = newMeasurement.measurement_name.trim();
    const lowerCaseName = trimmedName.toLowerCase();
    const type = newMeasurement.data_type;
  
    if (!trimmedName) {
      await Toast.show({
        text: 'Measurement name is required.',
        duration: 'short',
        position: 'bottom'
      });
      return;
    }
  
    const isDuplicate = currentGarment.measurements?.some(
      (m) =>
        m.measurement_name.trim().toLowerCase() === lowerCaseName &&
        m.data_type === type
    );
  
    if (isDuplicate) {
      await Toast.show({
        text: 'This measurement name with the same data type already exists.',
        duration: 'short',
        position: 'bottom'
      });
      return;
    }
  
    setCurrentGarment((prev) => ({
      ...prev,
      measurements: [
        ...(prev.measurements || []),
        {
          ...newMeasurement,
          measurement_name: trimmedName,
          seq: (prev.measurements?.length || 0) + 1,
        },
      ],
      
    }));
  
    setNewMeasurement({ measurement_name: '', data_type: 'number' });
  };

  const updateMeasurement = () => {
    if (
      editMeasurementIndex !== null &&
      newMeasurement.measurement_name &&
      newMeasurement.data_type
    ) {
      const updated = [...(currentGarment.measurements || [])];
  
      const originalSeq = updated[editMeasurementIndex].seq;
  
      updated[editMeasurementIndex] = {
        ...newMeasurement,
        seq: originalSeq
      };
  
      setCurrentGarment(prev => ({
        ...prev,
        measurements: updated
      }));
  
      setNewMeasurement({ measurement_name: '', data_type: 'text' } as Measurement);
      setEditMeasurementIndex(null);
    }
  };  

  const removeMeasurement = (index: number) => {
    const updatedMeasurements = [...currentGarment.measurements];
    updatedMeasurements.splice(index, 1);
    
    const reorderedMeasurements = updatedMeasurements.map((m, i) => ({
      ...m,
      seq: i + 1
    }));

    setCurrentGarment({
      ...currentGarment,
      measurements: reorderedMeasurements
    });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(currentGarment.measurements);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const reorderedWithSeq = items.map((item, index) => ({
      ...item,
      seq: index + 1
    }));

    setCurrentGarment({
      ...currentGarment,
      measurements: reorderedWithSeq
    });
  };

  const addProcess = () => {
    if (!selectedProcess || processPrice <= 0) return;

    const selectedOption = processOptions.find(opt => opt.value === selectedProcess);
    if (!selectedOption) return;

    const jobOrSales = selectedOption.job_or_sales;

    const newProcess: Process = {
      id: selectedOption.id,
      type_id: selectedOption.id, 
      name: selectedOption.value,
      price: processPrice,
      job_or_sales: jobOrSales
    };

    setCurrentGarment(prev => ({
      ...prev,
      processes: [...(prev.processes || []), newProcess]
    }));

    setProcessOptions(prev => prev.filter(opt => opt.value !== selectedProcess));
    
    setSelectedProcess('');
    setProcessPrice(0);
  };

  const removeProcess = (index: number) => {
    if (!currentGarment.processes) return;

    const removedProcess = currentGarment.processes[index];
    
    setCurrentGarment(prev => {
      const prevProcesses = prev.processes || [];
      return {
        ...prev,
        processes: prevProcesses.filter((_, i) => i !== index)
      };
    });

    if (removedProcess) {
      const optionExists = processOptions.some(opt => opt.value === removedProcess.name);
      if (!optionExists) {
        setProcessOptions(prev => [
          ...prev,
          {
            label: removedProcess.name,
            value: removedProcess.name,
            id: removedProcess.id,
            job_or_sales: removedProcess.job_or_sales,
            original_name: removedProcess.name.split(' - ')[0]
          }
        ]);
      }
    }
  };

  const confirmStatusChange = async (garmentId: number, newStatus: Ext) => {
    confirmDialog({
      message: `Are you sure you want to mark this product as ${newStatus === 'N' ? 'Active' : 'Inactive'}?`,
      header: 'Confirm Status Change',
      icon: 'pi pi-info-circle',
      accept: async () => {
        try {
          setListLoading(true);
          await MaterialService.updateMaterialStatus(String(garmentId), { ext: newStatus });
          
          await fetchMaterials();
          
          await Toast.show({
            text: `Product status updated to ${newStatus === 'N' ? 'Active' : 'Inactive'}`,
            duration: 'short',
            position: 'bottom'
          });
        } catch (err: any) {
          const errorMessage = err?.message || 'Failed to update product status';
          await Toast.show({
            text: errorMessage,
            duration: 'short',
            position: 'bottom'
          });
          console.error('Error:', err);
        } finally {
          setListLoading(false);
        }
      },
    });
  };

  const statusItemTemplate = (option: StatusOption | null | undefined) => {
    if (!option) return null;
  
    return (
      <div className="flex align-items-center gap-2">
        <i className={`${option.icon} ${option.value === 'N' ? 'text-green-500' : 'text-red-500'}`}></i>
        <span>{option.label}</span>
      </div>
    );
  };

  if (isInitialLoading || error) {
    return (
      <div className="flex flex-column p-3 lg:p-5" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-4 gap-3 w-full">
          <Skeleton width="10rem" height="1.5rem" />
          <Skeleton width="100%" height="2rem" className="md:w-20rem" />
          <Skeleton width="100%" height="2rem" />
        </div>
  
        <div className="flex flex-wrap gap-3 justify-content-start">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="flex flex-column w-full sm:w-20rem lg:w-22rem">
              <div className="flex justify-content-between align-items-start mb-2">
                <Skeleton width="10rem" height="1.75rem" />
                <Skeleton width="5rem" height="1.5rem" />
              </div>
  
              <Skeleton width="100%" height="1px" className="my-2" />
  
              <div className="flex flex-wrap gap-2 mt-1">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} width="5rem" height="1.5rem" borderRadius="1rem" />
                ))}
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
          <h2 className="text-2xl m-0">Products</h2>
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
            label="Add Product" 
            icon="pi pi-plus" 
            onClick={handleAdd}
            className="w-full md:w-auto"
            size="small"
          />
        </div>

        <div className="flex flex-wrap gap-3 justify-content-start">
          {garments.length > 0 ? (
            <>
              {garments.map((garment) => (
                <Card key={garment.id} className="flex flex-column w-full sm:w-20rem lg:w-22rem transition-all transition-duration-200 hover:shadow-4">
                  <div className="flex justify-content-between align-items-start">
                    <h3 className="text-xl m-0">{garment.name}</h3>
                    <Tag 
                      value={garment.ext === 'N' ? 'Active' : 'Inactive'}
                      severity={garment.ext === 'N' ? 'success' : 'danger'}
                      className="align-self-start"
                    />
                  </div>

                  <Divider className="my-2" />

                  <div className="flex flex-wrap gap-2">
                    {garment.measurements
                      ?.sort((a, b) => a.seq - b.seq)
                      .map((measurement, index) => (
                        <Tag 
                          key={index}
                          value={measurement.measurement_name}
                          className="capitalize"
                        />
                    ))}
                  </div>

                  <div className="flex justify-content-end gap-1 mt-3">
                    <Button 
                      icon="pi pi-pencil" 
                      rounded 
                      text 
                      onClick={() => handleEdit(garment)}
                      severity="secondary"
                    />
                    <Button 
                      icon={garment.ext === 'N' ? 'pi pi-trash' : 'pi pi-replay'} 
                      rounded 
                      text 
                      severity={garment.ext === 'N' ? 'danger' : 'warning'}
                      onClick={() => confirmStatusChange(garment.id, garment.ext === 'N' ? 'Y' : 'N')}
                    />
                  </div>
                </Card>
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
              <h3>No products found</h3>
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
          visible={showDialog} 
          onHide={() => setShowDialog(false)}
          header={editMode ? "Edit Product" : "Add New Product"}
          maximized={isMaximized}
          onMaximize={(e) => setIsMaximized(e.maximized)}
          className={isMaximized ? 'maximized-dialog' : ''}
          blockScroll
          footer={
            <div className="flex justify-content-end gap-2 mt-3">
              <Button 
                label="Cancel" 
                icon="pi pi-times" 
                onClick={() => setShowDialog(false)}
                className="p-button-text"
              />
              <Button 
                label="Save" 
                icon="pi pi-check" 
                onClick={handleSave}
                disabled={!currentGarment.name || currentGarment.measurements?.length === 0}
              />
            </div>
          }
        >
          <div className="flex flex-column gap-3 mt-3">
            <div className="field">
              <label htmlFor="productName">Product Name</label>
              <InputText
                id="productName"
                value={currentGarment.name}
                onChange={(e) => setCurrentGarment({
                  ...currentGarment,
                  name: e.target.value
                })}
                placeholder="Enter product name"
                className="w-full"
              />
            </div>

            <div className="field">
              <label>Add Measurement</label>
              <div className="flex gap-2">
                <div className="flex-1 flex gap-2" style={{ width: '80%' }}>
                  <InputText
                    value={newMeasurement.measurement_name}
                    onChange={(e) => setNewMeasurement({
                      ...newMeasurement,
                      measurement_name: e.target.value
                    })}
                    placeholder="Name"
                    className="w-6"
                  />
                  <Dropdown
                    value={newMeasurement.data_type}
                    options={[
                      { label: 'Text', value: 'text' },
                      { label: 'Number', value: 'number' }
                    ]}
                    onChange={(e) => setNewMeasurement({
                      ...newMeasurement,
                      data_type: e.value
                    })}
                    optionLabel="label"
                    optionValue="value"
                    className="w-6"
                  />
                </div>
                <Button 
                  icon={editMeasurementIndex !== null ? "pi pi-check" : "pi pi-plus"} 
                  onClick={editMeasurementIndex !== null ? updateMeasurement : addMeasurement}
                  className="w-2"
                  style={{ minWidth: 'auto' }}
                  />
              </div>
            </div>

            <div className="field">
              <label>Measurements</label>
              {currentGarment.measurements?.length === 0 ? (
                <div className="p-3 border-round surface-100 text-center">
                  No measurements added yet
                </div>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="measurements">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex flex-column gap-3"
                      >
                        {currentGarment.measurements.map((measurement, index) => (
                          <Draggable key={index} draggableId={`measurement-${index}`} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`p-3 border-round flex align-items-center gap-3 transition-all transition-duration-200 ${
                                  snapshot.isDragging 
                                    ? 'bg-gray-200 shadow-2' 
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                              >
                                <div 
                                  {...provided.dragHandleProps}
                                  className="flex flex-column gap-1 cursor-move text-gray-600"
                                >
                                  <i className="pi pi-bars"></i>
                                </div>
                                <div className="flex-1">
                                  <span className="font-medium capitalize">{measurement.measurement_name}</span>
                                  <small className="block text-color-secondary">({measurement.data_type})</small>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    icon="pi pi-pencil" 
                                    rounded 
                                    text 
                                    severity="info"
                                    className="p-button-sm"
                                    onClick={() => {
                                      setNewMeasurement(measurement);
                                      setEditMeasurementIndex(index);
                                    }}
                                  />
                                  <Button 
                                    icon="pi pi-trash" 
                                    rounded 
                                    text 
                                    severity="danger"
                                    onClick={() => removeMeasurement(index)}
                                    className="p-button-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>

            <div className="field">
              <label>Add Price with Process</label>
              <div className="flex gap-2">
                <div className="flex-1 flex gap-2" style={{ width: '80%' }}>
                  <Dropdown
                    value={selectedProcess}
                    options={processOptions}
                    onChange={(e) => setSelectedProcess(e.value)}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Process"
                    className="w-8"
                  />
                  <InputText
                    value={processPrice.toString()}
                    onChange={(e) => setProcessPrice(Number(e.target.value) || 0)}
                    placeholder="Price"
                    className="w-4"
                  />
                </div>
                <Button 
                  icon="pi pi-plus" 
                  onClick={addProcess}
                  className="w-2"
                  style={{ minWidth: 'auto' }}
                  disabled={!selectedProcess || processPrice <= 0}
                />
              </div>
            </div>

            <div className="field">
              <label>Price with Process</label>
              {currentGarment.processes?.length === 0 ? (
                <div className="p-3 border-round surface-100 text-center">
                  <i className="pi pi-info-circle mr-2"></i>
                  No processes with prices added yet
                </div>
              ) : (
                <div className="flex flex-column gap-3">
                  {currentGarment.processes?.map((process, index) => (
                    <div 
                      key={index}
                      className="p-3 border-round flex align-items-center gap-3 bg-gray-100 hover:bg-gray-200"
                    >
                      <div className="flex-1">
                        <span className="font-medium">{process.name}</span>
                        <small className="block text-color-secondary">₹{process.price.toLocaleString('en-IN')}</small>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          icon="pi pi-trash" 
                          rounded 
                          text 
                          severity="danger"
                          onClick={() => removeProcess(index)}
                          className="p-button-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="field">
              <label htmlFor="status">Status</label>
              <Dropdown
                id="status"
                value={currentGarment.ext}
                options={statusOptions}
                onChange={(e: DropdownChangeEvent) => setCurrentGarment({
                  ...currentGarment,
                  ext: e.value
                })}
                optionLabel="label"
                optionValue="value"
                itemTemplate={statusItemTemplate}
                valueTemplate={statusItemTemplate}
                className="w-full"
              />
            </div>
          </div>
        </Dialog>
        <ConfirmDialog />
      </div>
    </>
  );
};

export default Products;