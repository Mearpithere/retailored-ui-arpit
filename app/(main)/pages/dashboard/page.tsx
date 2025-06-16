/* eslint-disable @next/next/no-img-element */
'use client';
import Link from 'next/link';
import { Chart } from 'primereact/chart';
import { Skeleton } from 'primereact/skeleton';
import { ChartData, ChartOptions } from 'chart.js';
import React, { useContext, useEffect, useState } from 'react';
import { LayoutContext } from '@/layout/context/layoutcontext';
import { DashboardService } from '@/demo/service/dashboard.service';
import QuickActions from '@/demo/components/QuickActions';

const Dashboard = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const [lineOptions, setLineOptions] = useState<ChartOptions>({});
    const [barOptions, setBarOptions] = useState<ChartOptions>({});
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        jobOrderCount: 0,
        pendingJobOrderCount: 0,
        salesOrderCount: 0,
        ordersThisWeek: 0,
        pendingSalesOrderCount: 0,
        monthlyCounts: [] as { month: string; order_count: number; job_order_count: number }[],
        orderDetailsThisWeek: [] as { admsite_code: string; sitename: string; count: number }[],
        jobOrderDetailsThisWeek: [] as { admsite_code: string; sitename: string; count: number }[]
    });

    const deliveryData: ChartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        datasets: [
            {
                label: 'This Week Deliveries',
                data: [5, 7, 8, 6, 10, 6],
                fill: false,
                backgroundColor: '#2f4860',
                borderColor: '#2f4860',
                tension: 0.4
            },
            {
                label: 'Last Week Deliveries',
                data: [4, 6, 5, 7, 8, 5],
                fill: false,
                backgroundColor: '#00bb7e',
                borderColor: '#00bb7e',
                tension: 0.4
            }
        ]
    };

    const ordersData: ChartData = {
        labels: dashboardData.monthlyCounts.map(item => item.month.substring(5)),
        datasets: [
            {
                label: 'Job Orders',
                backgroundColor: '#36A2EB',
                data: dashboardData.monthlyCounts.map(item => item.job_order_count)
            },
            {
                label: 'Sales Orders',
                backgroundColor: '#FFCE56',
                data: dashboardData.monthlyCounts.map(item => item.order_count)
            }
        ]
    };

    const applyLightTheme = () => {
        const lineOptions: ChartOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: '#495057'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#495057'
                    },
                    grid: {
                        color: '#ebedef'
                    }
                },
                y: {
                    ticks: {
                        color: '#495057'
                    },
                    grid: {
                        color: '#ebedef'
                    }
                }
            }
        };

        const barOptions: ChartOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: '#495057'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#495057'
                    },
                    grid: {
                        color: '#ebedef'
                    }
                },
                y: {
                    ticks: {
                        color: '#495057'
                    },
                    grid: {
                        color: '#ebedef'
                    }
                }
            }
        };

        setLineOptions(lineOptions);
        setBarOptions(barOptions);
    };

    const applyDarkTheme = () => {
        const lineOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: '#ebedef'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#ebedef'
                    },
                    grid: {
                        color: 'rgba(160, 167, 181, .3)'
                    }
                },
                y: {
                    ticks: {
                        color: '#ebedef'
                    },
                    grid: {
                        color: 'rgba(160, 167, 181, .3)'
                    }
                }
            }
        };

        const barOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: '#ebedef'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#ebedef'
                    },
                    grid: {
                        color: 'rgba(160, 167, 181, .3)'
                    }
                },
                y: {
                    ticks: {
                        color: '#ebedef'
                    },
                    grid: {
                        color: 'rgba(160, 167, 181, .3)'
                    }
                }
            }
        };

        setLineOptions(lineOptions);
        setBarOptions(barOptions);
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const data = await DashboardService.getDashboardStats();
                setDashboardData(data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (layoutConfig.colorScheme === 'light') {
            applyLightTheme();
        } else {
            applyDarkTheme();
        }
    }, [layoutConfig.colorScheme]);

    const renderSkeleton = () => (
        <Skeleton width="100%" height="1.5rem" className="mb-2" />
    );

    const renderStatCard = (title: string, value: number | string, icon: string, iconColor: string) => (
        <div className="flex justify-content-between mb-3">
            <div>
                <span className="block text-500 font-medium mb-3">{title}</span>
                {loading ? (
                    renderSkeleton()
                ) : (
                    <div className="text-900 font-medium text-xl">{value}</div>
                )}
            </div>
            <div className="flex align-items-center justify-content-center border-round" 
                 style={{ width: '2.5rem', height: '2.5rem', backgroundColor: `${iconColor}20` }}>
                <i className={`pi ${icon} text-xl`} style={{ color: iconColor }} />
            </div>
        </div>
    );

    const renderListCard = (title: string, items: string[], icon: string, iconColor: string) => (
        <div className="flex justify-content-between mb-3">
            <div>
                <span className="block text-500 font-medium mb-3">{title}</span>
                {loading ? (
                    <>
                        {renderSkeleton()}
                        {renderSkeleton()}
                    </>
                ) : (
                    <div className="text-900 font-medium text-sm">
                        {items.join(', ')}
                    </div>
                )}
            </div>
            <div className="flex align-items-center justify-content-center border-round" 
                 style={{ width: '2.5rem', height: '2.5rem', backgroundColor: `${iconColor}20` }}>
                <i className={`pi ${icon} text-xl`} style={{ color: iconColor }} />
            </div>
        </div>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <QuickActions />
            </div>

            <div className="col-12 lg:col-6 xl:col-4">
                <div className="card mb-0">
                    {renderStatCard("This Week's Delivery (Qty)", dashboardData.ordersThisWeek, "pi-check-circle", "#00bb7e")}
                </div>
            </div>
            
            <div className="col-12 lg:col-6 xl:col-4">
                <div className="card mb-0">
                    {renderStatCard("Delayed Job Orders (Qty)", dashboardData.pendingJobOrderCount, "pi-exclamation-triangle", "#f87171")}
                </div>
            </div>
            
            <div className="col-12 lg:col-6 xl:col-4">
                <Link href="/pages/reports/pending-sales">
                    <div className="card mb-0 cursor-pointer hover:shadow-2 transition-duration-150">
                        {renderStatCard("Total Pending Orders", dashboardData.pendingSalesOrderCount, "pi-clock", "#fb923c")}
                    </div>
                </Link>
            </div>
            
            <div className="col-12 lg:col-6 xl:col-4">
                <Link href="/pages/reports/pending-jobs">
                    <div className="card mb-0 cursor-pointer hover:shadow-2 transition-duration-150">
                        {renderStatCard("Job Orders", dashboardData.jobOrderCount, "pi-briefcase", "#3b82f6")}
                    </div>
                </Link>
            </div>
            
            <div className="col-12 lg:col-6 xl:col-4">
                <div className="card mb-0">
                    {renderListCard(
                        "Customers This Week", 
                        dashboardData.orderDetailsThisWeek.map(c => c.sitename), 
                        "pi-users", 
                        "#8b5cf6"
                    )}
                </div>
            </div>
            
            <div className="col-12 lg:col-6 xl:col-4">
                <div className="card mb-0">
                    {renderListCard(
                        "Jobbers This Week", 
                        dashboardData.jobOrderDetailsThisWeek.map(j => j.sitename), 
                        "pi-wrench", 
                        "#06b6d4"
                    )}
                </div>
            </div>

            <div className="col-12 xl:col-6">
                <div className="card">
                    <h5>Weekly Deliveries</h5>
                    {loading ? (
                        <Skeleton width="100%" height="300px" />
                    ) : (
                        <Chart type="line" data={deliveryData} options={lineOptions} />
                    )}
                </div>
            </div>
            
            <div className="col-12 xl:col-6">
                <div className="card">
                    <h5>Orders Overview</h5>
                    {loading ? (
                        <Skeleton width="100%" height="300px" />
                    ) : (
                        <Chart type="bar" data={ordersData} options={barOptions} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;