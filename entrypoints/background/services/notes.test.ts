import { describe, it, expect } from 'vitest';
import { findMatchingLocation } from './notes';
import { Note, AttachmentTypeEnum } from '@entrypoints/shared/types/notes';

describe('findMatchingLocation', () => {
  const mockNote: Note = {
    id: 'test-note',
    title: 'Test Note',
    content: 'Test content',
    locations: [
      {
        attachmentType: AttachmentTypeEnum.GLOBAL,
        domain: '',
        url: ''
      },
      {
        attachmentType: AttachmentTypeEnum.DOMAIN,
        domain: 'example.com',
        url: 'https://example.com/specific-page'
      },
      {
        attachmentType: AttachmentTypeEnum.DOMAIN,
        domain: 'example.com',
        url: ''
      },
      {
        attachmentType: AttachmentTypeEnum.ROUTE,
        domain: 'example.com',
        routePattern: '/dashboard/*'
      },
      {
        attachmentType: AttachmentTypeEnum.ROUTE,
        domain: 'example.com',
        routePattern: '/dashboard/settings'
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isVisible: true
  };

  it('should select exact route match over pattern route match', () => {
    const result = findMatchingLocation(mockNote, 'example.com', 'https://example.com/dashboard/settings');
    
    expect(result).toBeDefined();
    expect(result?.attachmentType).toBe(AttachmentTypeEnum.ROUTE);
    expect(result?.routePattern).toBe('/dashboard/settings');
  });

  it('should select route pattern over domain match', () => {
    const result = findMatchingLocation(mockNote, 'example.com', 'https://example.com/dashboard/profile');
    
    expect(result).toBeDefined();
    expect(result?.attachmentType).toBe(AttachmentTypeEnum.ROUTE);
    expect(result?.routePattern).toBe('/dashboard/*');
  });

  it('should select exact URL domain match over general domain match', () => {
    const result = findMatchingLocation(mockNote, 'example.com', 'https://example.com/specific-page');
    
    expect(result).toBeDefined();
    expect(result?.attachmentType).toBe(AttachmentTypeEnum.DOMAIN);
    expect(result?.url).toBe('https://example.com/specific-page');
  });

  it('should select general domain match over global match', () => {
    const result = findMatchingLocation(mockNote, 'example.com', 'https://example.com/random-page');
    
    expect(result).toBeDefined();
    expect(result?.attachmentType).toBe(AttachmentTypeEnum.DOMAIN);
    expect(result?.url).toBe('');
    expect(result?.domain).toBe('example.com');
  });

  it('should select global match when no other matches', () => {
    const result = findMatchingLocation(mockNote, 'different.com', 'https://different.com/page');
    
    expect(result).toBeDefined();
    expect(result?.attachmentType).toBe(AttachmentTypeEnum.GLOBAL);
  });

  it('should return undefined when no matches found', () => {
    const noteWithoutGlobal: Note = {
      ...mockNote,
      locations: [
        {
          attachmentType: AttachmentTypeEnum.DOMAIN,
          domain: 'example.com',
          url: ''
        }
      ]
    };

    const result = findMatchingLocation(noteWithoutGlobal, 'different.com', 'https://different.com/page');
    
    expect(result).toBeUndefined();
  });

  it('should handle wildcard route patterns correctly', () => {
    const noteWithWildcard: Note = {
      ...mockNote,
      locations: [
        {
          attachmentType: AttachmentTypeEnum.ROUTE,
          domain: 'example.com',
          routePattern: '/api/*/users'
        }
      ]
    };

    const result = findMatchingLocation(noteWithWildcard, 'example.com', 'https://example.com/api/v1/users');
    
    expect(result).toBeDefined();
    expect(result?.attachmentType).toBe(AttachmentTypeEnum.ROUTE);
    expect(result?.routePattern).toBe('/api/*/users');
  });

  it('should prioritize longer route patterns when both match', () => {
    const noteWithMultiplePatterns: Note = {
      ...mockNote,
      locations: [
        {
          attachmentType: AttachmentTypeEnum.ROUTE,
          domain: 'example.com',
          routePattern: '/dashboard/*'
        },
        {
          attachmentType: AttachmentTypeEnum.ROUTE,
          domain: 'example.com',
          routePattern: '/dashboard/settings/*'
        }
      ]
    };

    const result = findMatchingLocation(noteWithMultiplePatterns, 'example.com', 'https://example.com/dashboard/settings/profile');
    
    expect(result).toBeDefined();
    expect(result?.routePattern).toBe('/dashboard/settings/*');
  });
});