/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Avatar } from 'primereact/avatar';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { RadioButton } from 'primereact/radiobutton';
import { Divider } from 'primereact/divider';
import { FileUpload } from 'primereact/fileupload';
import { useState, useRef } from 'react';
import { Toast } from '@capacitor/toast';

interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: Date | null;
    gender: 'M' | 'F';
    avatar: string | null;
    role: string;
    department: string;
    joinDate: Date | null;
}

const ProfilePage = () => {
    const [profile, setProfile] = useState<UserProfile>({
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        phone: '+91 9876543210',
        dateOfBirth: new Date('1990-01-15'),
        gender: 'M',
        avatar: null,
        role: 'Administrator',
        department: 'Management',
        joinDate: new Date('2020-03-01')
    });
    
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileUploadRef = useRef<FileUpload>(null);

    const handleSave = async () => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await Toast.show({
                text: 'Profile updated successfully',
                duration: 'short',
                position: 'bottom'
            });
            
            setIsEditing(false);
        } catch (error) {
            await Toast.show({
                text: 'Failed to update profile',
                duration: 'short',
                position: 'bottom'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = (event: any) => {
        const file = event.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setProfile(prev => ({
                    ...prev,
                    avatar: e.target?.result as string
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const getInitials = () => {
        return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
    };

    return (
        <div className="grid p-3">
            <div className="col-12">
                <div className="flex align-items-center justify-content-between mb-4">
                    <h2 className="text-2xl m-0 font-500">My Profile</h2>
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <Button 
                                    label="Cancel" 
                                    icon="pi pi-times" 
                                    severity="secondary"
                                    onClick={() => setIsEditing(false)}
                                    disabled={loading}
                                />
                                <Button 
                                    label="Save Changes" 
                                    icon="pi pi-check" 
                                    onClick={handleSave}
                                    loading={loading}
                                />
                            </>
                        ) : (
                            <Button 
                                label="Edit Profile" 
                                icon="pi pi-pencil" 
                                onClick={() => setIsEditing(true)}
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="col-12 lg:col-4">
                <Card className="h-full">
                    <div className="flex flex-column align-items-center gap-4">
                        <div className="relative">
                            {profile.avatar ? (
                                <img 
                                    src={profile.avatar} 
                                    alt="Profile" 
                                    className="w-8rem h-8rem border-circle object-cover shadow-4"
                                />
                            ) : (
                                <Avatar 
                                    label={getInitials()} 
                                    size="xlarge" 
                                    shape="circle" 
                                    className="shadow-4 text-2xl font-semibold bg-primary text-white"
                                    style={{ width: '8rem', height: '8rem' }}
                                />
                            )}
                            
                            {isEditing && (
                                <div className="absolute" style={{ bottom: '0', right: '0' }}>
                                    <FileUpload
                                        ref={fileUploadRef}
                                        mode="basic"
                                        accept="image/*"
                                        maxFileSize={1000000}
                                        onSelect={handleAvatarUpload}
                                        chooseOptions={{
                                            icon: 'pi pi-camera',
                                            className: 'p-button-rounded p-button-sm'
                                        }}
                                        auto
                                    />
                                </div>
                            )}
                        </div>

                        <div className="text-center">
                            <h3 className="text-xl m-0 mb-2">{profile.firstName} {profile.lastName}</h3>
                            <p className="text-500 m-0 mb-1">{profile.role}</p>
                            <p className="text-500 m-0">{profile.department}</p>
                        </div>

                        <Divider />

                        <div className="w-full">
                            <div className="flex align-items-center gap-3 mb-3">
                                <i className="pi pi-envelope text-500" style={{ fontSize: '1.2rem' }}></i>
                                <span>{profile.email}</span>
                            </div>
                            <div className="flex align-items-center gap-3 mb-3">
                                <i className="pi pi-phone text-500" style={{ fontSize: '1.2rem' }}></i>
                                <span>{profile.phone}</span>
                            </div>
                            <div className="flex align-items-center gap-3">
                                <i className="pi pi-calendar text-500" style={{ fontSize: '1.2rem' }}></i>
                                <span>Joined {profile.joinDate?.toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long' 
                                })}</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="col-12 lg:col-8">
                <Card>
                    <h3 className="text-xl mb-4">Personal Information</h3>
                    
                    <div className="p-fluid grid">
                        <div className="field col-12 md:col-6">
                            <label htmlFor="firstName">First Name</label>
                            <InputText
                                id="firstName"
                                value={profile.firstName}
                                onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                                disabled={!isEditing}
                            />
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="lastName">Last Name</label>
                            <InputText
                                id="lastName"
                                value={profile.lastName}
                                onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                                disabled={!isEditing}
                            />
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="email">Email</label>
                            <InputText
                                id="email"
                                value={profile.email}
                                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                                disabled={!isEditing}
                            />
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="phone">Phone</label>
                            <InputText
                                id="phone"
                                value={profile.phone}
                                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                                disabled={!isEditing}
                            />
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="dob">Date of Birth</label>
                            <Calendar
                                id="dob"
                                value={profile.dateOfBirth}
                                onChange={(e) => {
                                    const newDate = e.value === undefined ? null : e.value;
                                    setProfile(prev => ({
                                        ...prev,
                                        dateOfBirth: newDate
                                    }));
                                }}
                                disabled={!isEditing}
                                dateFormat="dd/mm/yy"
                                showIcon
                            />
                        </div>

                        <div className="field col-12 md:col-6">
                            <label>Gender</label>
                            <div className="flex align-items-center gap-4 mt-2">
                                <div className="flex align-items-center">
                                    <RadioButton
                                        inputId="male"
                                        name="gender"
                                        value="M"
                                        onChange={(e) => setProfile(prev => ({ ...prev, gender: e.value }))}
                                        checked={profile.gender === 'M'}
                                        disabled={!isEditing}
                                    />
                                    <label htmlFor="male" className="ml-2">Male</label>
                                </div>
                                <div className="flex align-items-center">
                                    <RadioButton
                                        inputId="female"
                                        name="gender"
                                        value="F"
                                        onChange={(e) => setProfile(prev => ({ ...prev, gender: e.value }))}
                                        checked={profile.gender === 'F'}
                                        disabled={!isEditing}
                                    />
                                    <label htmlFor="female" className="ml-2">Female</label>
                                </div>
                            </div>
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="role">Role</label>
                            <InputText
                                id="role"
                                value={profile.role}
                                disabled
                                className="bg-gray-100"
                            />
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="department">Department</label>
                            <InputText
                                id="department"
                                value={profile.department}
                                disabled
                                className="bg-gray-100"
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ProfilePage;
