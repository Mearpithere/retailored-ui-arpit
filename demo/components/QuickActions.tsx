'use client';
import React from 'react';
import { Card } from 'primereact/card';
import { useRouter } from 'next/navigation';

interface QuickAction {
    id: string;
    label: string;
    icon: string;
    color: string;
    path: string;
    description: string;
}

const QuickActions: React.FC = () => {
    const router = useRouter();

    const quickActions: QuickAction[] = [
        {
            id: 'add-customer',
            label: 'Add Customer',
            icon: 'pi pi-user-plus',
            color: '#3b82f6',
            path: '/pages/customer/customer-list',
            description: 'Register new customer'
        },
        {
            id: 'create-order',
            label: 'New Order',
            icon: 'pi pi-shopping-cart',
            color: '#10b981',
            path: '/pages/orders/create-order',
            description: 'Create sales order'
        },
        {
            id: 'add-product',
            label: 'Add Product',
            icon: 'pi pi-box',
            color: '#f59e0b',
            path: '/pages/products',
            description: 'Add new product'
        },
        {
            id: 'job-order',
            label: 'Job Order',
            icon: 'pi pi-briefcase',
            color: '#8b5cf6',
            path: '/pages/orders/job-order',
            description: 'Create job order'
        },
        {
            id: 'pending-payments',
            label: 'Payments',
            icon: 'pi pi-dollar',
            color: '#ef4444',
            path: '/pages/reports/pending-payments',
            description: 'View pending payments'
        },
        {
            id: 'reports',
            label: 'Reports',
            icon: 'pi pi-chart-bar',
            color: '#06b6d4',
            path: '/pages/reports/pending-sales',
            description: 'View reports'
        }
    ];

    const handleActionClick = (action: QuickAction) => {
        router.push(action.path);
    };

    return (
        <Card className="mb-4 mr-0 lg:mr-3">
            <div className="flex align-items-center justify-content-between mb-3">
                <h3 className="text-xl m-0 font-500">Quick Actions</h3>
                <i className="pi pi-bolt text-yellow-500 text-xl"></i>
            </div>

            <div className="grid">
                {quickActions.map((action) => (
                    <div key={action.id} className="col-12 sm:col-6 lg:col-4 xl:col-2">
                        <div
                            className="quick-action-card p-3 border-round cursor-pointer transition-all transition-duration-200 hover:shadow-3 text-center h-full flex flex-column"
                            onClick={() => handleActionClick(action)}
                            style={{
                                border: `2px solid ${action.color}20`,
                                backgroundColor: `${action.color}10`,
                                minHeight: '120px'
                            }}
                        >
                            <div
                                className="flex align-items-center justify-content-center border-circle mb-3 mx-auto"
                                style={{
                                    width: '3rem',
                                    height: '3rem',
                                    backgroundColor: `${action.color}20`,
                                    color: action.color
                                }}
                            >
                                <i className={`${action.icon} text-xl`}></i>
                            </div>

                            <h4 className="text-sm font-semibold m-0 mb-1 flex-shrink-0" style={{ color: action.color }}>
                                {action.label}
                            </h4>

                            <p className="text-xs text-500 m-0 line-height-3 flex-grow-1 flex align-items-center justify-content-center">
                                {action.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .quick-action-card:hover {
                    transform: translateY(-2px);
                }
                
                .quick-action-card:active {
                    transform: translateY(0);
                }
            `}</style>
        </Card>
    );
};

export default QuickActions;
