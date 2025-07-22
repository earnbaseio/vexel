"use client";

import { useState } from 'react';
import {
  ShareIcon,
  UsersIcon,
  LinkIcon,
  GlobeAltIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { IKnowledgeCollection } from '@/app/lib/interfaces';
import CollectionSharingModal from './CollectionSharingModal';

interface CollectionShareButtonProps {
  collection: IKnowledgeCollection;
  onShare?: (emails: string[], permissions: any) => void;
  onCreateShareLink?: (permissions: any, expiresAt?: string) => void;
  className?: string;
  variant?: 'button' | 'menu-item';
}

export default function CollectionShareButton({
  collection,
  onShare,
  onCreateShareLink,
  className = '',
  variant = 'button',
}: CollectionShareButtonProps) {
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [showQuickShare, setShowQuickShare] = useState(false);

  const handleQuickShare = (type: 'public' | 'private') => {
    if (type === 'public') {
      // Create a public share link
      onCreateShareLink?.({ read: true, write: false, delete: false, share: false });
    } else {
      // Open full sharing modal
      setShowSharingModal(true);
    }
    setShowQuickShare(false);
  };

  const handleShare = (emails: string[], permissions: any) => {
    onShare?.(emails, permissions);
    setShowSharingModal(false);
  };

  const handleCreateShareLink = (permissions: any, expiresAt?: string) => {
    onCreateShareLink?.(permissions, expiresAt);
  };

  const getShareStatus = () => {
    // This would come from the collection's sharing metadata
    const isShared = collection.permissions.share;
    const hasPublicLink = false; // This would be determined from actual data
    
    if (hasPublicLink) return 'public';
    if (isShared) return 'shared';
    return 'private';
  };

  const shareStatus = getShareStatus();

  if (variant === 'menu-item') {
    return (
      <>
        <button
          onClick={() => setShowSharingModal(true)}
          className={`flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${className}`}
        >
          <ShareIcon className="mr-3 h-4 w-4" />
          Share Collection
        </button>

        <CollectionSharingModal
          isOpen={showSharingModal}
          collection={collection}
          onClose={() => setShowSharingModal(false)}
          onShare={handleShare}
          onUpdateUserPermissions={(userId, permissions) => {
            console.log('Update user permissions:', userId, permissions);
          }}
          onRemoveUser={(userId) => {
            console.log('Remove user:', userId);
          }}
          onCreateShareLink={handleCreateShareLink}
          onUpdateShareLink={(linkId, permissions, expiresAt) => {
            console.log('Update share link:', linkId, permissions, expiresAt);
          }}
          onDeleteShareLink={(linkId) => {
            console.log('Delete share link:', linkId);
          }}
        />
      </>
    );
  }

  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button
            className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 ${className}`}
          >
            <ShareIcon className="h-4 w-4 mr-2" />
            Share
            {shareStatus !== 'private' && (
              <div className="ml-2 flex items-center">
                {shareStatus === 'public' ? (
                  <GlobeAltIcon className="h-3 w-3 text-green-500" />
                ) : (
                  <UsersIcon className="h-3 w-3 text-blue-500" />
                )}
              </div>
            )}
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {/* Quick Share Options */}
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                Quick Share
              </div>
              
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => handleQuickShare('public')}
                    className={`${
                      active ? 'bg-gray-100' : ''
                    } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                  >
                    <GlobeAltIcon className="mr-3 h-4 w-4 text-green-500" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">Create public link</div>
                      <div className="text-xs text-gray-500">Anyone with the link can view</div>
                    </div>
                  </button>
                )}
              </Menu.Item>

              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => handleQuickShare('private')}
                    className={`${
                      active ? 'bg-gray-100' : ''
                    } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                  >
                    <UsersIcon className="mr-3 h-4 w-4 text-blue-500" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">Share with specific people</div>
                      <div className="text-xs text-gray-500">Invite by email</div>
                    </div>
                  </button>
                )}
              </Menu.Item>

              {/* Advanced Options */}
              <div className="border-t border-gray-100 mt-1 pt-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setShowSharingModal(true)}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                    >
                      <ShareIcon className="mr-3 h-4 w-4" />
                      Advanced sharing...
                    </button>
                  )}
                </Menu.Item>
              </div>

              {/* Current Status */}
              {shareStatus !== 'private' && (
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <div className="px-4 py-2 text-xs text-gray-500">
                    <div className="flex items-center">
                      {shareStatus === 'public' ? (
                        <>
                          <GlobeAltIcon className="h-3 w-3 mr-1 text-green-500" />
                          Public link active
                        </>
                      ) : (
                        <>
                          <UsersIcon className="h-3 w-3 mr-1 text-blue-500" />
                          Shared with people
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Full Sharing Modal */}
      <CollectionSharingModal
        isOpen={showSharingModal}
        collection={collection}
        onClose={() => setShowSharingModal(false)}
        onShare={handleShare}
        onUpdateUserPermissions={(userId, permissions) => {
          console.log('Update user permissions:', userId, permissions);
        }}
        onRemoveUser={(userId) => {
          console.log('Remove user:', userId);
        }}
        onCreateShareLink={handleCreateShareLink}
        onUpdateShareLink={(linkId, permissions, expiresAt) => {
          console.log('Update share link:', linkId, permissions, expiresAt);
        }}
        onDeleteShareLink={(linkId) => {
          console.log('Delete share link:', linkId);
        }}
      />
    </>
  );
}
