'use client';
import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { Divider } from 'primereact/divider';

interface MeasurementData {
  measurement_date: string;
  measurementDetails: {
    measurement_val: string;
    measurement_main_id: string;
    measurementMaster: {
      id: string;
      measurement_name: string;
      data_type: string;
    };
  }[];
}

interface OrderDetail {
  id: string;
  order_id: string;
  measurement_main_id: string;
  image_url: string[] | null;
  material_master_id: string;
  trial_date: string | null;
  delivery_date: string | null;
  item_amt: number;
  ord_qty: number;
  delivered_qty: number;
  cancelled_qty: number;
  desc1: string | null;
  ext: string;
  item_ref: string;
  orderStatus: {
    id: string;
    status_name: string;
  } | null;
  material: {
    id: string;
    name: string;
  };
}

interface Order {
  id: string;
  user_id: string;
  docno: string;
  order_date: string;
  customer: string;
  ord_amt: number;
  amt_paid: number;
  amt_due: number;
  ord_qty: number;
  delivered_qty: number;
  cancelled_qty: number;
  tentitive_delivery_date: string;
  delivery_date: string;
  desc1: string | null;
  ext: string;
  user: {
    id: string;
    fname: string;
    admsite_code: number;
  };
  orderStatus: {
    id: string;
    status_name: string;
  } | null;
  orderDetails: OrderDetail[];
}

interface ProductMeasurementsModalProps {
  visible: boolean;
  onHide: () => void;
  selectedProduct: OrderDetail | null;
  selectedOrder: Order | null;
  measurementData: MeasurementData | null;
  loadingMeasurements: boolean;
  isMaximized: boolean;
  onMaximize: (e: { maximized: boolean }) => void;
}

const ProductMeasurementsModal: React.FC<ProductMeasurementsModalProps> = ({
  visible,
  onHide,
  selectedProduct,
  selectedOrder,
  measurementData,
  loadingMeasurements,
  isMaximized,
  onMaximize
}) => {
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Not scheduled';
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Check if date is valid
    if (isNaN(dateObj.getTime())) return 'Not scheduled';

    // Format as DD-MM-YYYY | HH:MM AM/PM
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    return `${day}-${month}-${year} | ${displayHours}:${minutes} ${ampm}`;
  };

  return (
    <Dialog
      header={
        <div className="flex justify-content-between align-items-center w-full px-2">
          <Button
            icon="pi pi-pencil"
            className="p-button-rounded p-button-text p-button-sm flex-1"
            tooltip="Edit"
          />
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-text p-button-sm flex-1"
            tooltip="Delete"
          />
          <Button
            icon="pi pi-print"
            className="p-button-rounded p-button-text p-button-sm flex-1"
            tooltip="Print"
          />
          <Button
            icon="pi pi-phone"
            className="p-button-rounded p-button-text p-button-sm flex-1"
            tooltip="Call"
          />
          <Button
            icon="pi pi-download"
            className="p-button-rounded p-button-text p-button-sm flex-1"
            tooltip="Download"
          />
          <Button
            icon="pi pi-times"
            className="p-button-rounded p-button-text p-button-sm flex-1"
            onClick={onHide}
            tooltip="Close"
          />
        </div>
      }
      visible={visible}
      onHide={onHide}
      maximized={isMaximized}
      onMaximize={onMaximize}
      className={isMaximized ? 'maximized-dialog' : ''}
      blockScroll
      style={{ width: '90vw', maxWidth: '800px' }}
      showHeader={true}
      closable={false}
    >
      {selectedProduct && selectedOrder && (
        <div className="p-fluid">
          {/* Header Information */}
          <div className="mb-4">
            <div className="flex justify-content-between align-items-center mb-3 pb-2 border-bottom-1 surface-border">
              <span className="text-600">Name</span>
              <span className="text-primary cursor-pointer">{selectedOrder.user?.fname || 'Customer'}</span>
            </div>

            <div className="flex justify-content-between align-items-center mb-3 pb-2 border-bottom-1 surface-border">
              <span className="text-600">Order Number</span>
              <span className="font-medium text-900">{selectedOrder.docno}</span>
            </div>

            <div className="flex justify-content-between align-items-center mb-3 pb-2 border-bottom-1 surface-border">
              <span className="text-600">Delivery date</span>
              <span className="font-medium text-900">{formatDate(selectedProduct.delivery_date)}</span>
            </div>

            <div className="flex justify-content-between align-items-center mb-3 pb-2 border-bottom-1 surface-border">
              <span className="text-600">Trial date</span>
              <span className="font-medium text-900">{formatDate(selectedProduct.trial_date)}</span>
            </div>

            <div className="flex justify-content-between align-items-center mb-3 pb-2 border-bottom-1 surface-border">
              <span className="text-600">Type</span>
              <span className="font-medium text-900">{selectedProduct.material?.name || 'Stitching'}</span>
            </div>

            <div className="flex justify-content-between align-items-center mb-4 pb-2">
              <span className="text-600">Item Status</span>
              <div className="flex align-items-center gap-2">
                <span className="bg-orange-100 text-orange-800 px-2 py-1 border-round text-sm">
                  {selectedProduct.orderStatus?.status_name || 'Accepted'}
                </span>
                <i className="pi pi-chevron-down text-600 cursor-pointer"></i>
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="mb-4">
            {/* Product Cards */}
            <div className="surface-100 p-3 border-round mb-3">
              <div className="font-medium text-900">{selectedProduct.material?.name || 'Kurta Pajama (Top)'}</div>
            </div>

            <div className="surface-100 p-3 border-round mb-4">
              <div className="font-medium text-900">Kurta Pajama (Bottom)</div>
            </div>
          </div>

          {/* Measurements Section */}
          {loadingMeasurements ? (
            <div className="surface-100 p-4 border-round mb-4">
              <div className="flex align-items-center gap-3 mb-4">
                <Skeleton shape="circle" size="2rem" />
                <div className="flex flex-column gap-2 w-full">
                  <Skeleton width="200px" height="1.5rem" />
                  <Skeleton width="150px" height="1rem" />
                </div>
              </div>
              <div className="grid">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="col-12 md:col-6 mb-3">
                    <Skeleton width="100%" height="1.5rem" className="mb-2" />
                    <Skeleton width="80%" height="1rem" />
                  </div>
                ))}
              </div>
            </div>
          ) : measurementData && measurementData.measurementDetails?.length > 0 ? (
            <div className="mb-4">
              <div className="flex align-items-center gap-2 mb-3">
                <i className="pi pi-ruler text-primary"></i>
                <span className="font-bold text-xl text-900">Measurements</span>
              </div>
              <div className="surface-100 p-3 border-round mb-3">
                <div className="text-600 text-sm">
                  Taken on: {new Date(measurementData.measurement_date).toLocaleString()}
                </div>
              </div>

              <div className="grid">
                {measurementData.measurementDetails.map((detail, index) => (
                  <div key={index} className="col-12 md:col-6 mb-3">
                    <div className="surface-card p-3 border-round border-1 surface-border h-full">
                      <div className="flex justify-content-between align-items-center">
                        <div>
                          <div className="font-medium text-900">{detail.measurementMaster.measurement_name}</div>
                          <div className="text-600 text-sm">({detail.measurementMaster.data_type})</div>
                        </div>
                        <div className="font-bold text-primary text-lg">{detail.measurement_val}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="surface-100 p-4 border-round mb-4 text-center">
              <i className="pi pi-info-circle text-3xl mb-3 text-600" />
              <div className="font-medium text-900 mb-2">No Measurements Available</div>
              <p className="text-600 m-0">No measurement details found for this product.</p>
            </div>
          )}

          {/* Price Breakup Section */}
          <div className="surface-100 p-4 border-round">
            <div className="font-bold text-900 mb-3">Price Breakup</div>

            <div style={{ borderTop: '2px dashed #e5e7eb', marginBottom: '1rem' }}></div>

            <div className="flex justify-content-between align-items-center mb-3">
              <span className="text-600">Stitching Cost</span>
              <span className="text-900 font-medium">1 X {selectedProduct.item_amt || 132}.0</span>
            </div>

            <div style={{ borderTop: '2px dashed #e5e7eb', marginBottom: '1rem' }}></div>

            <div className="flex justify-content-between align-items-center">
              <span className="font-bold text-900">Total:</span>
              <span className="font-bold text-900">₹{selectedProduct.item_amt || 132}.0</span>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default ProductMeasurementsModal;
