import { TEAM_FLAGS, ALL_TEAMS } from './teams';
import { EUROVISION_FLAGS, ALL_EUROVISION_COUNTRIES } from './eurovision';

export type SweepstakeType = 'worldcup' | 'eurovision' | 'custom';

export const getParticipantsByType = (type: SweepstakeType, customOptions?: string[]): Record<string, string> => {
  if (type === 'eurovision') {
    return EUROVISION_FLAGS;
  }
  if (type === 'custom' && customOptions) {
    const customRecord: Record<string, string> = {};
    customOptions.forEach(option => {
      customRecord[option] = option; // No flag image for custom options
    });
    return customRecord;
  }
  return TEAM_FLAGS;
};

export const getAllParticipantsByType = (type: SweepstakeType, customOptions?: string[]): string[] => {
  if (type === 'eurovision') {
    return ALL_EUROVISION_COUNTRIES;
  }
  if (type === 'custom' && customOptions) {
    return customOptions;
  }
  return ALL_TEAMS;
};

// Rarity tiers for different sweepstake types
export const WORLD_CUP_ULTRA_RARE = ['Brazil', 'France', 'Argentina', 'England', 'Germany'];
export const WORLD_CUP_RARE = ['Spain', 'Portugal', 'Netherlands', 'Belgium', 'Uruguay'];

export const EUROVISION_ULTRA_RARE = ['Sweden', 'Italy', 'Ukraine'];
export const EUROVISION_RARE = ['Greece', 'Netherlands', 'France', 'Spain', 'United Kingdom'];

export const getRarityTier = (participant: string, type: SweepstakeType): 'ultra-rare' | 'rare' | 'common' => {
  if (type === 'custom') {
    return 'common'; // All custom options are common rarity
  }
  if (type === 'eurovision') {
    if (EUROVISION_ULTRA_RARE.includes(participant)) return 'ultra-rare';
    if (EUROVISION_RARE.includes(participant)) return 'rare';
  } else {
    if (WORLD_CUP_ULTRA_RARE.includes(participant)) return 'ultra-rare';
    if (WORLD_CUP_RARE.includes(participant)) return 'rare';
  }
  return 'common';
};
