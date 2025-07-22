"use client";

import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  UserPlusIcon,
  LinkIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  GlobeAltIcon,
  LockClosedIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { IKnowledgeCollection } from '@/app/lib/interfaces';

interface SharePermission {
  read: boolean;
  write: boolean;
  delete: boolean;
  share: boolean;
}

interface SharedUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  permissions: SharePermission;
  sharedAt: string;
  status: 'pending' | 'accepted' | 'declined';
}

interface ShareLink {
  id: string;
  url: string;
  permissions: SharePermission;
  expiresAt?: string;
  createdAt: string;
  accessCount: number;
  isActive: boolean;
}

interface CollectionSharingModalProps {
  isOpen: boolean;
  collection: IKnowledgeCollection | null;
  onClose: () => void;
  onShare: (emails: string[], permissions: SharePermission) => void;
  onUpdateUserPermissions: (userId: string, permissions: SharePermission) => void;
  onRemoveUser: (userId: string) => void;
  onCreateShareLink: (permissions: SharePermission, expiresAt?: string) => void;
  onUpdateShareLink: (linkId: string, permissions: SharePermission, expiresAt?: string) => void;
  onDeleteShareLink: (linkId: string) => void;
}

export default function CollectionSharingModal({
  isOpen,
  collection,
  onClose,
  onShare,
  onUpdateUserPermissions,
  onRemoveUser,
  onCreateShareLink,
  onUpdateShareLink,
  onDeleteShareLink,
}: CollectionSharingModalProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'links'>('users');
  const [emailInput, setEmailInput] = useState('');
  const [emailList, setEmailList] = useState<string[]>([]);
  const [sharePermissions, setSharePermissions] = useState<SharePermission>({
    read: true,
    write: false,
    delete: false,
    share: false,
  });
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [linkExpiry, setLinkExpiry] = useState<string>('');

  // Mock data - in real implementation, this would come from props or API
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([
    {
      id: '1',
      email: 'john@example.com',
      name: 'John Doe',
      permissions: { read: true, write: true, delete: false, share: false },
      sharedAt: '2024-01-15T10:00:00Z',
      status: 'accepted',
    },
    {
      id: '2',
      email: 'jane@example.com',
      name: 'Jane Smith',
      permissions: { read: true, write: false, delete: false, share: false },
      sharedAt: '2024-01-16T14:30:00Z',
      status: 'pending',
    },
  ]);

  const [shareLinks, setShareLinks] = useState<ShareLink[]>([
    {
      id: '1',
      url: 'https://vexel.com/shared/abc123',
      permissions: { read: true, write: false, delete: false, share: false },
      createdAt: '2024-01-15T10:00:00Z',
      accessCount: 5,
      isActive: true,
    },
  ]);

  const handleAddEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (email && email.includes('@') && !emailList.includes(email)) {
      setEmailList([...emailList, email]);
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (email: string) => {
    setEmailList(emailList.filter(e => e !== email));
  };

  const handleShareWithUsers = () => {
    if (emailList.length > 0) {
      onShare(emailList, sharePermissions);
      setEmailList([]);
      setEmailInput('');
    }
  };

  const handleCreateShareLink = () => {
    const expiresAt = linkExpiry ? new Date(linkExpiry).toISOString() : undefined;
    onCreateShareLink(sharePermissions, expiresAt);
    setIsCreatingLink(false);
    setLinkExpiry('');
  };

  const handleCopyLink = async (link: ShareLink) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedLinkId(link.id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const getPermissionIcon = (permission: keyof SharePermission) => {
    switch (permission) {
      case 'read':
        return EyeIcon;
      case 'write':
        return PencilIcon;
      case 'delete':
        return TrashIcon;
      case 'share':
        return UsersIcon;
      default:
        return EyeIcon;
    }
  };

  const getPermissionLabel = (permission: keyof SharePermission) => {
    switch (permission) {
      case 'read':
        return 'View';
      case 'write':
        return 'Edit';
      case 'delete':
        return 'Delete';
      case 'share':
        return 'Share';
      default:
        return 'View';
    }
  };

  if (!isOpen || !collection) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Share Collection
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Share "{collection.name}" with others
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-rose-500 text-rose-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UsersIcon className="h-4 w-4 inline mr-2" />
                People ({sharedUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('links')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'links'
                    ? 'border-rose-500 text-rose-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LinkIcon className="h-4 w-4 inline mr-2" />
                Links ({shareLinks.length})
              </button>
            </nav>
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Add Users */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Invite people
                </h4>
                
                {/* Email Input */}
                <div className="flex space-x-2 mb-3">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                    placeholder="Enter email address"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                  />
                  <button
                    onClick={handleAddEmail}
                    className="px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                  >
                    Add
                  </button>
                </div>

                {/* Email List */}
                {emailList.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {emailList.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {email}
                        <button
                          onClick={() => handleRemoveEmail(email)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Permissions */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(sharePermissions).map(([key, value]) => {
                      const IconComponent = getPermissionIcon(key as keyof SharePermission);
                      return (
                        <label
                          key={key}
                          className="flex items-center space-x-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) =>
                              setSharePermissions(prev => ({
                                ...prev,
                                [key]: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                          />
                          <IconComponent className="h-4 w-4 text-gray-500" />
                          <span>{getPermissionLabel(key as keyof SharePermission)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Share Button */}
                <button
                  onClick={handleShareWithUsers}
                  disabled={emailList.length === 0}
                  className="w-full px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserPlusIcon className="h-4 w-4 inline mr-2" />
                  Share with {emailList.length} {emailList.length === 1 ? 'person' : 'people'}
                </button>
              </div>

              {/* Shared Users List */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  People with access
                </h4>
                <div className="space-y-3">
                  {sharedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.email}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.status === 'accepted' 
                            ? 'bg-green-100 text-green-800'
                            : user.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          {Object.entries(user.permissions).map(([key, value]) => {
                            if (!value) return null;
                            const IconComponent = getPermissionIcon(key as keyof SharePermission);
                            return (
                              <IconComponent
                                key={key}
                                className="h-4 w-4 text-gray-500"
                                title={getPermissionLabel(key as keyof SharePermission)}
                              />
                            );
                          })}
                        </div>
                        <button
                          onClick={() => onRemoveUser(user.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Links Tab */}
          {activeTab === 'links' && (
            <div className="space-y-6">
              {/* Create Link */}
              {!isCreatingLink ? (
                <button
                  onClick={() => setIsCreatingLink(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                >
                  <LinkIcon className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-600">
                    Create shareable link
                  </span>
                </button>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Create shareable link
                  </h4>
                  
                  {/* Link Permissions */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permissions
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(sharePermissions).map(([key, value]) => {
                        const IconComponent = getPermissionIcon(key as keyof SharePermission);
                        return (
                          <label
                            key={key}
                            className="flex items-center space-x-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) =>
                                setSharePermissions(prev => ({
                                  ...prev,
                                  [key]: e.target.checked,
                                }))
                              }
                              className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                            />
                            <IconComponent className="h-4 w-4 text-gray-500" />
                            <span>{getPermissionLabel(key as keyof SharePermission)}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expiry */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expires (optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={linkExpiry}
                      onChange={(e) => setLinkExpiry(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCreateShareLink}
                      className="flex-1 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                    >
                      Create Link
                    </button>
                    <button
                      onClick={() => setIsCreatingLink(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Share Links List */}
              {shareLinks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Active links
                  </h4>
                  <div className="space-y-3">
                    {shareLinks.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <GlobeAltIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">
                              Shareable link
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              link.isActive 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {link.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            {link.accessCount} views • Created {new Date(link.createdAt).toLocaleDateString()}
                            {link.expiresAt && ` • Expires ${new Date(link.expiresAt).toLocaleDateString()}`}
                          </div>
                          <div className="flex space-x-1">
                            {Object.entries(link.permissions).map(([key, value]) => {
                              if (!value) return null;
                              const IconComponent = getPermissionIcon(key as keyof SharePermission);
                              return (
                                <IconComponent
                                  key={key}
                                  className="h-3 w-3 text-gray-500"
                                  title={getPermissionLabel(key as keyof SharePermission)}
                                />
                              );
                            })}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleCopyLink(link)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                            title="Copy link"
                          >
                            {copiedLinkId === link.id ? (
                              <CheckIcon className="h-4 w-4 text-green-500" />
                            ) : (
                              <ClipboardDocumentIcon className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => onDeleteShareLink(link.id)}
                            className="p-2 text-red-400 hover:text-red-600 rounded-md hover:bg-red-50"
                            title="Delete link"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
