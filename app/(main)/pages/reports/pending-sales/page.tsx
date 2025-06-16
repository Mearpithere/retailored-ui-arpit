/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Toast } from '@capacitor/toast';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Sidebar } from 'primereact/sidebar';
import { InputText } from 'primereact/inputtext';
import { Divider } from 'primereact/divider';
import { Skeleton } from 'primereact/skeleton';
import { useDebounce } from 'use-debounce';
import { ReportsService } from '@/demo/service/reports.service';
import { SalesOrderService } from '@/demo/service/sales-order.service';
import FullPageLoader from '@/demo/components/FullPageLoader';
import { useInfiniteObserver } from '@/demo/hooks/useInfiniteObserver';

interface JobOrderStatus {
  id: string;
  job_order_main_id: string;
  status: string;
  status_name: string;
  created_at?: string;
  updated_at?: string;
}

interface Customer {
  id: string;
  fname: string;
  lname?: string;
  email?: string;
  mobileNumber: string;
  alternateContact?: string;
  admsite_code: string;
}

interface Material {
  id: string;
  name: string;
  image_url?: string[];
  material_type: string;
  wsp?: number;
  mrp?: number;
  measurements?: {
    id: string;
    measurement_name: string;
    data_type: string;
    seq: number;
  }[];
}

interface OrderMain {
  id: string;
  docno: string;
  order_date: string;
  tentitive_delivery_date?: string;
  ord_amt?: number;
  amt_paid?: number;
  amt_due?: number;
  desc1?: string;
}

interface MeasurementMain {
  id: string;
  docno: string;
  measurement_date: string;
  measurementDetails?: {
    id: string;
    measurement_master_id: string;
    measurement_val: string;
    measurementMaster: {
      measurement_name: string;
      data_type: string;
    };
  }[];
}

interface StatusHistory {
  id: string;
  status_id: number;
  status_name: string;
  changed_at: string;
  changed_by?: string;
}

interface PriceChart {
  id: string;
  type_id: number;
  job_or_sales: string;
  price: number;
  type: {
    type_name: string;
  };
}

interface PendingOrderItem {
  id: string;
  order_id: string;
  customerID: string;
  customerName: string;
  productID: string;
  productName: string;
  productRef: string;
  deliveryDate: string;
  trialDate?: string;
  receivedDate?: string;
  admsite_code: string;
  statusId: number;
  status: string;
  ord_qty?: number;
  delivered_qty?: number;
  cancelled_qty?: number;
  item_amt?: number;
  item_discount?: number;
  jobOrderStatus: JobOrderStatus[];
  last_jobId: string | null;

  // Enhanced data from GraphQL
  customer?: Customer;
  material?: Material;
  orderMain?: OrderMain;
  measurementMain?: MeasurementMain;
  statusHistory?: StatusHistory[];
  priceChart?: PriceChart[];
}

interface PendingOrdersResponse {
  data: PendingOrderItem[];
  paginatorInfo: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    hasMorePages: boolean;
  };
}

const PendingSalesReport = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<PendingOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 1000);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0,
    hasMorePages: true
  });
  const [statusSidebarVisible, setStatusSidebarVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PendingOrderItem | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PendingOrderItem | null>(null);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuItem, setContextMenuItem] = useState<PendingOrderItem | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const availableStatuses = [
    { id: 1, name: 'Pending' },
    { id: 2, name: 'In Progress' },
    { id: 3, name: 'Completed' },
    { id: 4, name: 'Cancelled' }
  ];

  const fetchPendingOrders = useCallback(async (page: number, perPage: number, loadMore = false) => {
    try {
      if (loadMore) {
        setIsFetchingMore(true);
      } else {
        setLoading(true);
      }

      const response: PendingOrdersResponse = await ReportsService.getPendingSalesOrders(
        page,
        perPage,
        debouncedSearchTerm
      );

      if (loadMore) {
        setOrders(prev => [...prev, ...response.data]);
      } else {
        setOrders(response.data);
      }

      setPagination({
        currentPage: response.paginatorInfo.currentPage,
        perPage: response.paginatorInfo.perPage,
        total: response.paginatorInfo.total,
        hasMorePages: response.paginatorInfo.hasMorePages
      });
    } catch (error) {
      console.error('Error fetching pending sales orders:', error);
      await Toast.show({
        text: 'Failed to load pending orders',
        duration: 'short',
        position: 'bottom'
      });
    } finally {
      if (loadMore) {
        setIsFetchingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchPendingOrders(1, pagination.perPage);
  }, [fetchPendingOrders, pagination.perPage, debouncedSearchTerm]);

  useInfiniteObserver({
    targetRef: observerTarget,
    hasMorePages: pagination.hasMorePages,
    isLoading: isFetchingMore,
    onIntersect: () => {
      if (pagination.hasMorePages) {
        fetchPendingOrders(pagination.currentPage + 1, pagination.perPage, true);
      }
    },
    deps: [pagination.hasMorePages, searchTerm]
  });

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'info';
      case 'Pending': return 'warning';
      case 'Cancelled': return 'danger';
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleCreateViewJO = (item: PendingOrderItem) => {
    const { order_id, jobOrderStatus } = item;
    
    if (jobOrderStatus.length === 0) {
      router.push(`/pages/orders/job-order?id=${order_id}&completed=false&source=pending-sales`);
    } else {
      router.push(`/pages/orders/job-order?id=${order_id}&source=pending-sales`);
    }
  };

  const openStatusChangeDialog = (item: PendingOrderItem) => {
    setSelectedItem(item);
    setSelectedStatus(item.statusId);
    setStatusSidebarVisible(true);
  };

  const handleStatusChange = async (statusId: number) => {
    if (!selectedItem) return;

    try {
      setIsSaving(true);

      console.log('Updating status for item:', selectedItem.id, 'to status:', statusId);

      await SalesOrderService.updateSalesOrderStatus(
        selectedItem.id,
        { status_id: statusId }
      );

      await Toast.show({
        text: 'Status updated successfully',
        duration: 'short',
        position: 'bottom'
      });

      await fetchPendingOrders(1, pagination.perPage);
      setStatusSidebarVisible(false);
    } catch (error: any) {
      console.error('Error updating status:', error);
      const errorMessage = error?.message || 'Failed to update status';
      await Toast.show({
        text: errorMessage,
        duration: 'short',
        position: 'bottom'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (item: PendingOrderItem) => {
    setItemToDelete(item);
    setDeleteConfirmVisible(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      setIsSaving(true);

      console.log('Deleting item:', itemToDelete.id);

      const result = await ReportsService.deleteSalesOrderItem(itemToDelete.id);

      console.log('Delete result:', result);

      await Toast.show({
        text: 'Item deleted successfully',
        duration: 'short',
        position: 'bottom'
      });

      await fetchPendingOrders(1, pagination.perPage);
    } catch (error: any) {
      console.error('Error deleting item:', error);
      const errorMessage = error?.message || 'Failed to delete item';
      await Toast.show({
        text: errorMessage,
        duration: 'short',
        position: 'bottom'
      });
    } finally {
      setIsSaving(false);
      setDeleteConfirmVisible(false);
    }
  };

  const viewSalesOrder = (orderId: string) => {
    router.push(`/pages/orders/sales-order?id=${orderId}&source=pending-sales`);
  };

  // Long press and click handlers
  const handleCardClick = (item: PendingOrderItem) => {
    // Prevent click if long press was triggered
    if (isLongPressing) {
      setIsLongPressing(false);
      return;
    }
    // Single click - navigate to sales order details
    viewSalesOrder(item.order_id);
  };

  const handleLongPressStart = (item: PendingOrderItem, event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    setIsLongPressing(false);
    const timer = setTimeout(() => {
      setIsLongPressing(true);
      setContextMenuItem(item);
      setContextMenuVisible(true);
      // Haptic feedback for mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms for long press
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    // Reset long press state after a short delay to prevent accidental clicks
    setTimeout(() => setIsLongPressing(false), 100);
  };

  const handleContextMenuAction = (action: string) => {
    if (!contextMenuItem) return;

    switch (action) {
      case 'view-sales-order':
        viewSalesOrder(contextMenuItem.order_id);
        break;
      case 'create-view-job-order':
        handleCreateViewJO(contextMenuItem);
        break;
      case 'change-status':
        openStatusChangeDialog(contextMenuItem);
        break;
      case 'delete':
        confirmDelete(contextMenuItem);
        break;
    }
    setContextMenuVisible(false);
    setContextMenuItem(null);
  };

  if (loading && !isFetchingMore && !debouncedSearchTerm) {
    return (
      <div className="flex flex-column p-3 lg:p-5" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-4 gap-3 w-full">
          <Skeleton width="10rem" height="2rem" />
          <Skeleton width="100%" height="2.5rem" className="md:w-20rem" />
        </div>
  
        <div className="grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="col-12 md:col-6 lg:col-4">
              <Card className="h-full">
                <div className="flex flex-column gap-2">
                  <div className="flex justify-content-between align-items-center">
                    <Skeleton width="8rem" height="1.25rem" />
                    <Skeleton width="5rem" height="1.25rem" />
                  </div>
  
                  <Divider className="my-2" />
  
                  <div className="flex flex-column gap-1">
                    <div className="flex justify-content-between">
                      <Skeleton width="6rem" height="1rem" />
                      <Skeleton width="7rem" height="1rem" />
                    </div>
                    <div className="flex justify-content-between">
                      <Skeleton width="6rem" height="1rem" />
                      <Skeleton width="7rem" height="1rem" />
                    </div>
                    <div className="flex justify-content-between">
                      <Skeleton width="6rem" height="1rem" />
                      <Skeleton width="7rem" height="1rem" />
                    </div>
                  </div>
  
                  <Divider className="my-2" />
  
                  <div className="flex gap-2">
                    <Skeleton width="100%" height="2rem" />
                    <Skeleton width="100%" height="2rem" />
                    <Skeleton width="100%" height="2rem" />
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-column p-3 lg:p-5" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {isSaving && <FullPageLoader />}

      <style jsx>{`
        .context-menu-dialog .p-dialog-content {
          padding: 1rem !important;
        }

        .premium-card {
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          backdrop-filter: blur(10px);
        }

        .premium-card:active {
          transform: scale(0.97);
          transition: transform 0.1s ease;
        }

        @media (hover: hover) {
          .premium-card:hover {
            box-shadow: 0 8px 40px rgba(249, 115, 22, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1) !important;
            transform: translateY(-4px) scale(1.02);
            border-color: #ea580c;
          }
        }

        .premium-card .p-card-body {
          padding: 0 !important;
        }

        .premium-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%);
          border-radius: 20px;
          z-index: -1;
        }

        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }

        .premium-card:hover::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          animation: shimmer 1.5s ease-in-out;
          border-radius: 20px;
          pointer-events: none;
        }
      `}</style>
      
      <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-4 gap-3">
        <h2 className="text-2xl m-0">Pending Sales Orders Report</h2>
        <span className="p-input-icon-left p-input-icon-right w-full">
          <i className="pi pi-search" />
          <InputText 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search"
            className="w-full"
          />

          {loading && debouncedSearchTerm ? (
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
      </div>
      
      <div className="grid">
        {orders.length > 0 ? (
          orders.map((item, index) => (
            <div
              key={`${item.order_id}-${item.id}`}
              className="col-12 md:col-6 lg:col-4"
              ref={index === orders.length - 1 ? observerTarget : null}
            >
              <Card
                className="h-full cursor-pointer hover:shadow-3 transition-all transition-duration-200 premium-card"
                onClick={() => handleCardClick(item)}
                onMouseDown={(e) => handleLongPressStart(item, e)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={(e) => handleLongPressStart(item, e)}
                onTouchEnd={handleLongPressEnd}
                style={{
                  userSelect: 'none',
                  border: '2px dashed #f97316',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div className="p-3">
                  {/* Header Section */}
                  <div className="flex justify-content-between align-items-start mb-3">
                    <div className="flex align-items-center gap-3">
                      {/* Premium Avatar/Initial */}
                      <div
                        className="flex align-items-center justify-content-center"
                        style={{
                          width: '52px',
                          height: '52px',
                          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          borderRadius: '16px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: '#ffffff',
                          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                          border: '2px solid rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        {item.customerName.substring(0, 2).toUpperCase()}
                      </div>

                      {/* Enhanced Order Info with more data */}
                      <div className="flex flex-column">
                        <div className="flex align-items-center gap-2 mb-1">
                          <i className="pi pi-user" style={{ fontSize: '14px', color: '#6366f1', lineHeight: '1' }}></i>
                          <span className="font-semibold text-sm" style={{ color: '#1e293b' }}>
                            {item.customer?.fname || item.customerName}
                            {item.customer?.lname && ` ${item.customer.lname}`}
                          </span>
                        </div>
                        <span className="font-medium text-sm" style={{ color: '#64748b', marginLeft: '22px' }}>
                          Order No: {item.orderMain?.docno || item.order_id}
                        </span>
                      </div>
                    </div>

                    {/* Enhanced Category Tag with material type */}
                    <div className="flex align-items-center gap-2" style={{ marginTop: '6px' }}>
                      <i className="pi pi-tag" style={{ fontSize: '12px', color: '#6366f1' }}></i>
                      <span className="text-sm font-medium" style={{ color: '#475569' }}>
                        {item.material?.material_type || 'Stitching'}
                      </span>
                    </div>
                  </div>

                  {/* Enhanced Product Section */}
                  <div className="flex justify-content-between align-items-start mb-3">
                    <div className="flex flex-column gap-1">
                      <div className="flex align-items-center gap-2">
                        <i className="pi pi-shopping-bag" style={{ fontSize: '14px', color: '#06b6d4', lineHeight: '1' }}></i>
                        <span className="font-semibold text-lg" style={{ color: '#1e293b' }}>
                          {item.material?.name || item.productName}
                        </span>
                      </div>

                      {/* Additional product details */}
                      <div className="flex align-items-center gap-3 ml-4">
                        {item.ord_qty && (
                          <div className="flex align-items-center gap-1">
                            <i className="pi pi-box" style={{ fontSize: '10px', color: '#64748b' }}></i>
                            <span className="text-xs" style={{ color: '#64748b' }}>Qty: {item.ord_qty}</span>
                          </div>
                        )}
                        {item.item_amt && (
                          <div className="flex align-items-center gap-1">
                            <i className="pi pi-dollar" style={{ fontSize: '10px', color: '#64748b' }}></i>
                            <span className="text-xs" style={{ color: '#64748b' }}>₹{item.item_amt}</span>
                          </div>
                        )}
                        {item.material?.mrp && (
                          <div className="flex align-items-center gap-1">
                            <i className="pi pi-tag" style={{ fontSize: '10px', color: '#64748b' }}></i>
                            <span className="text-xs" style={{ color: '#64748b' }}>MRP: ₹{item.material.mrp}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Premium Status Tag */}
                    <div
                      className="px-3 py-2 text-xs font-semibold"
                      style={{
                        borderRadius: '16px',
                        background: item.status === 'Accepted'
                          ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                          : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        color: item.status === 'Accepted' ? '#92400e' : '#1e40af',
                        border: item.status === 'Accepted'
                          ? '1px solid #f59e0b'
                          : '1px solid #3b82f6',
                        boxShadow: item.status === 'Accepted'
                          ? '0 2px 8px rgba(245, 158, 11, 0.2)'
                          : '0 2px 8px rgba(59, 130, 246, 0.2)'
                      }}
                    >
                      {item.status}
                    </div>
                  </div>

                  {/* Enhanced Date Information */}
                  <div
                    className="p-2"
                    style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div className="flex justify-content-between align-items-center mb-2">
                      <div className="flex align-items-center gap-2">
                        <i className="pi pi-calendar" style={{ fontSize: '12px', color: '#6366f1' }}></i>
                        <span className="font-medium text-sm" style={{ color: '#374151' }}>
                          Trial: {item.trialDate ? formatDate(item.trialDate) : 'Not Set'}
                        </span>
                      </div>
                      <div className="flex align-items-center gap-2">
                        <i className="pi pi-calendar" style={{ fontSize: '12px', color: '#6366f1' }}></i>
                        <span className="font-medium text-sm" style={{ color: '#374151' }}>
                          Delivery: {item.deliveryDate ? formatDate(item.deliveryDate) : 'Not Set'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-content-between align-items-center mb-2">
                      <div className="flex align-items-center gap-2">
                        <i className="pi pi-clock" style={{ fontSize: '12px', color: '#6366f1' }}></i>
                        <span className="font-medium text-sm" style={{ color: '#374151' }}>
                          Received: {item.receivedDate ? formatDate(item.receivedDate) : 'Not Set'}
                        </span>
                      </div>
                      {item.orderMain?.order_date && (
                        <div className="flex align-items-center gap-2">
                          <i className="pi pi-plus-circle" style={{ fontSize: '12px', color: '#6366f1' }}></i>
                          <span className="font-medium text-sm" style={{ color: '#374151' }}>
                            Ordered: {formatDate(item.orderMain.order_date)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress indicators */}
                    {(item.delivered_qty || item.cancelled_qty) && (
                      <div className="flex justify-content-between align-items-center">
                        {item.delivered_qty && (
                          <div className="flex align-items-center gap-2">
                            <i className="pi pi-check-circle" style={{ fontSize: '12px', color: '#10b981' }}></i>
                            <span className="font-medium text-sm" style={{ color: '#10b981' }}>
                              Delivered: {item.delivered_qty}
                            </span>
                          </div>
                        )}
                        {item.cancelled_qty && (
                          <div className="flex align-items-center gap-2">
                            <i className="pi pi-times-circle" style={{ fontSize: '12px', color: '#ef4444' }}></i>
                            <span className="font-medium text-sm" style={{ color: '#ef4444' }}>
                              Cancelled: {item.cancelled_qty}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ))
        ) : (
          <div className="col-12">
            <div className="p-4 text-center surface-100 border-round">
              <i className="pi pi-search text-3xl mb-1" />
              <h4>No pending orders found</h4>
            </div>
          </div>
        )}
      </div>

      {isFetchingMore && (
        <div className="flex justify-content-center mt-3">
          <div className="flex align-items-center gap-2">
            <i className="pi pi-spinner pi-spin" />
            <span>Loading more orders...</span>
          </div>
        </div>
      )}

      <Sidebar 
        visible={statusSidebarVisible} 
        onHide={() => setStatusSidebarVisible(false)}
        position="bottom"
        style={{ 
          width: '100%',
          height: 'auto',
          maxHeight: '62vh',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)'
        }}
        header={
          <div className="sticky top-0 bg-white z-1 p-3 surface-border flex justify-content-between align-items-center">
            <span className="font-bold text-xl">Update Item Status</span>
          </div>
        }
        className="p-0"
      >
        <div className="p-3">
          <div className="grid">
            {availableStatuses.map(status => (
              <div key={status.id} className="col-12 md:col-6 lg:col-4 p-2">
                <Button
                  label={status.name}
                  onClick={() => handleStatusChange((status.id))}
                  severity={getStatusSeverity(status.name) || undefined}
                  className="w-full p-3 text-lg justify-content-start p-button-outlined"
                  icon={
                    status.name === 'Completed' ? 'pi pi-check-circle' :
                    status.name === 'In Progress' ? 'pi pi-spinner' :
                    status.name === 'Pending' ? 'pi pi-clock' :
                    status.name === 'Cancelled' ? 'pi pi-times-circle' :
                    'pi pi-info-circle'
                  }
                  disabled={
                    (status.id) === selectedItem?.statusId || 
                    ((status.id) === 3 && (
                      !selectedItem?.jobOrderStatus?.length || 
                      selectedItem.jobOrderStatus[selectedItem.jobOrderStatus.length - 1].status_name !== 'Completed'
                    ))
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </Sidebar>

      {/* Enhanced Context Menu with Rich Data */}
      <Dialog
        header={
          <div className="flex align-items-center gap-3">
            <div
              className="flex align-items-center justify-content-center"
              style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#ffffff'
              }}
            >
              {(contextMenuItem?.customer?.fname || contextMenuItem?.customerName || 'O').substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-column">
              <span className="font-semibold">
                {contextMenuItem?.customer?.fname || contextMenuItem?.customerName || 'Order'}
                {contextMenuItem?.customer?.lname && ` ${contextMenuItem.customer.lname}`}
              </span>
              {contextMenuItem?.customer?.mobileNumber && (
                <span className="text-sm text-600">
                  {contextMenuItem.customer.mobileNumber}
                </span>
              )}
            </div>
          </div>
        }
        visible={contextMenuVisible}
        onHide={() => setContextMenuVisible(false)}
        style={{ width: '90vw', maxWidth: '450px' }}
        className="context-menu-dialog"
      >
        <div className="flex flex-column gap-2 mt-2">
          <Button
            label="View Sales Order"
            icon="pi pi-eye"
            onClick={() => handleContextMenuAction('view-sales-order')}
            className="w-full p-3 justify-content-start"
          />
          <Button
            label={(contextMenuItem?.jobOrderStatus?.length || 0) > 0 ? 'View Job Order' : 'Create Job Order'}
            icon={(contextMenuItem?.jobOrderStatus?.length || 0) > 0 ? 'pi pi-eye' : 'pi pi-plus'}
            onClick={() => handleContextMenuAction('create-view-job-order')}
            className={`w-full p-3 justify-content-start ${
              (contextMenuItem?.jobOrderStatus?.length || 0) > 0 ? 'p-button-info' : 'p-button-warning'
            }`}
          />
          <Button
            label="Change Status"
            icon="pi pi-cog"
            onClick={() => handleContextMenuAction('change-status')}
            className="w-full p-3 justify-content-start p-button-secondary"
          />
          <Button
            label="Delete Item"
            icon="pi pi-trash"
            onClick={() => handleContextMenuAction('delete')}
            className="w-full p-3 justify-content-start p-button-danger"
            disabled={(contextMenuItem?.jobOrderStatus?.length || 0) > 0 &&
              contextMenuItem?.jobOrderStatus?.[contextMenuItem.jobOrderStatus.length - 1]?.status_name === 'Completed'}
          />
        </div>
      </Dialog>

      <Dialog
        header="Confirm Delete"
        visible={deleteConfirmVisible}
        onHide={() => setDeleteConfirmVisible(false)}
        style={{ width: '90vw', maxWidth: '500px' }}
      >
        <div className="flex flex-column gap-3 mt-2">
          <p>
            {itemToDelete && orders.filter(o => o.order_id === itemToDelete.order_id && o.id !== itemToDelete.id).length === 0
              ? "This is the only item in the Sales Order. Deleting this will delete the entire Sales Order. Continue?"
              : "Are you sure you want to delete this item?"}
          </p>
          
          <div className="flex justify-content-end gap-2 mt-3">
            <Button 
              label="Cancel" 
              icon="pi pi-times" 
              onClick={() => setDeleteConfirmVisible(false)}
              className="p-button-text"
            />
            <Button 
              label="Delete" 
              icon="pi pi-trash" 
              onClick={handleDeleteItem}
              className="p-button-danger"
              loading={isSaving}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default PendingSalesReport;