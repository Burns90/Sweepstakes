import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { ALL_TEAMS } from '../constants/teams';
import { db } from './firebase';

export type SweepstakeType = 'worldcup' | 'eurovision' | 'custom';

export interface Sweepstake {
  id: string;
  ownerId: string;
  name: string;
  leagueCode: string;
  type: SweepstakeType;
  enrollmentDeadline: Date;
  tournamentYear: number;
  status: 'active' | 'completed' | 'cancelled';
  winnerId: string | null;
  createdAt: Date;
  customOptions?: string[];
}

export interface Player {
  id: string;
  sweepstakeId: string;
  userId: string;
  assignedTeam: string;
  paid: boolean;
  isEliminated: boolean;
  joinedAt: Date;
  playerName?: string; // For guest players
}

export const sweepstakeApi = {
  generateLeagueCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  },

  async createSweepstake(
    ownerId: string,
    name: string,
    enrollmentDeadline: Date,
    type: SweepstakeType = 'worldcup',
    customOptions?: string[]
  ): Promise<Sweepstake> {
    const leagueCode = this.generateLeagueCode();

    const sweepstakeData: any = {
      ownerId,
      name,
      leagueCode,
      type,
      enrollmentDeadline: Timestamp.fromDate(enrollmentDeadline),
      tournamentYear: 2026,
      status: 'active',
      winnerId: null,
      createdAt: Timestamp.fromDate(new Date()),
    };

    if (type === 'custom' && customOptions) {
      sweepstakeData.customOptions = customOptions;
    }

    const docRef = await addDoc(collection(db, 'sweepstakes'), sweepstakeData);

    return {
      id: docRef.id,
      ...sweepstakeData,
      enrollmentDeadline,
      createdAt: new Date(),
      customOptions: customOptions,
    } as Sweepstake;
  },

  async getSweepstakeByCode(leagueCode: string): Promise<Sweepstake | null> {
    const q = query(collection(db, 'sweepstakes'), where('leagueCode', '==', leagueCode));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      ownerId: data.ownerId,
      name: data.name,
      leagueCode: data.leagueCode,
      type: data.type || 'worldcup',
      enrollmentDeadline: data.enrollmentDeadline.toDate(),
      tournamentYear: data.tournamentYear,
      status: data.status,
      winnerId: data.winnerId,
      createdAt: data.createdAt.toDate(),
      customOptions: data.customOptions,
    };
  },

  async getSweepstakeById(sweepstakeId: string): Promise<Sweepstake | null> {
    const docRef = doc(db, 'sweepstakes', sweepstakeId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ownerId: data.ownerId,
      type: data.type || 'worldcup',
      name: data.name,
      leagueCode: data.leagueCode,
      enrollmentDeadline: data.enrollmentDeadline.toDate(),
      tournamentYear: data.tournamentYear,
      status: data.status,
      winnerId: data.winnerId,
      createdAt: data.createdAt.toDate(),
      customOptions: data.customOptions,
    };
  },

  async getPlayersSweepstakes(userId: string): Promise<string[]> {
    const q = query(
      collection(db, 'sweepstakes'),
      where('players', 'array-contains', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.id);
  },

  async assignTeamToPlayer(
    sweepstakeId: string,
    userId: string,
    team: string,
    playerName?: string
  ): Promise<Player> {
    console.log('assignTeamToPlayer called with:', { sweepstakeId, userId, team, playerName }); // DEBUG
    
    const playerData: any = {
      sweepstakeId,
      userId,
      assignedTeam: team,
      paid: false,
      isEliminated: false,
      joinedAt: Timestamp.fromDate(new Date()),
    };

    if (playerName && playerName.trim()) {
      playerData.playerName = playerName;
      console.log('Added playerName to playerData:', playerName); // DEBUG
    } else {
      console.log('⚠ playerName was empty or falsy:', playerName); // DEBUG
    }

    console.log('Storing player data:', playerData); // DEBUG

    const docRef = await addDoc(collection(db, `sweepstakes/${sweepstakeId}/players`), playerData);

    return {
      id: docRef.id,
      ...playerData,
      joinedAt: new Date(),
    } as Player;
  },

  async getAvailableTeams(sweepstakeId: string): Promise<string[]> {
    // Fetch the sweepstake to get its type and custom options
    const sweepstake = await this.getSweepstakeById(sweepstakeId);
    if (!sweepstake) {
      throw new Error('Sweepstake not found');
    }

    const playersSnapshot = await getDocs(
      collection(db, `sweepstakes/${sweepstakeId}/players`)
    );
    const assignedTeams = playersSnapshot.docs.map((doc) => doc.data().assignedTeam);

    // Determine the full list of available options based on sweepstake type
    let allOptions: string[] = ALL_TEAMS; // Default to world cup teams
    if (sweepstake.type === 'eurovision') {
      const { ALL_EUROVISION_COUNTRIES } = await import('../constants/eurovision');
      allOptions = ALL_EUROVISION_COUNTRIES;
    } else if (sweepstake.type === 'custom' && sweepstake.customOptions) {
      allOptions = sweepstake.customOptions;
    }

    return allOptions.filter((team) => !assignedTeams.includes(team));
  },

  async getPlayersByTeam(sweepstakeId: string, team: string): Promise<Player | null> {
    const q = query(
      collection(db, `sweepstakes/${sweepstakeId}/players`),
      where('assignedTeam', '==', team)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      sweepstakeId: data.sweepstakeId,
      userId: data.userId,
      assignedTeam: data.assignedTeam,
      paid: data.paid,
      isEliminated: data.isEliminated,
      joinedAt: data.joinedAt.toDate(),
    };
  },

  async markPlayerAsPaid(sweepstakeId: string, playerId: string): Promise<void> {
    const playerRef = doc(db, `sweepstakes/${sweepstakeId}/players`, playerId);
    await updateDoc(playerRef, { paid: true });
  },

  async togglePlayerPaidStatus(sweepstakeId: string, playerId: string, currentStatus: boolean): Promise<void> {
    const playerRef = doc(db, `sweepstakes/${sweepstakeId}/players`, playerId);
    await updateDoc(playerRef, { paid: !currentStatus });
  },

  async updatePlayerEliminationStatus(
    sweepstakeId: string,
    playerId: string,
    isEliminated: boolean
  ): Promise<void> {
    const playerRef = doc(db, `sweepstakes/${sweepstakeId}/players`, playerId);
    await updateDoc(playerRef, { isEliminated });
  },

  async deletePlayer(sweepstakeId: string, playerId: string): Promise<void> {
    const playerRef = doc(db, `sweepstakes/${sweepstakeId}/players`, playerId);
    await deleteDoc(playerRef);
  },

  async getOwnedSweepstakes(userId: string): Promise<Sweepstake[]> {
    const q = query(collection(db, 'sweepstakes'), where('ownerId', '==', userId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ownerId: data.ownerId,
        name: data.name,
        leagueCode: data.leagueCode,
        type: data.type || 'worldcup',
        enrollmentDeadline: data.enrollmentDeadline.toDate(),
        tournamentYear: data.tournamentYear,
        status: data.status,
        winnerId: data.winnerId,
        createdAt: data.createdAt.toDate(),
        customOptions: data.customOptions,
      };
    });
  },

  async getPlayerSweepstakes(userId: string): Promise<(Sweepstake & { assignedTeam: string })[]> {
    // Find all sweepstakes where this user is a player
    const allSweepstakesSnapshot = await getDocs(collection(db, 'sweepstakes'));
    const playerSweepstakes: (Sweepstake & { assignedTeam: string })[] = [];

    for (const sweepDoc of allSweepstakesSnapshot.docs) {
      const playersRef = collection(db, `sweepstakes/${sweepDoc.id}/players`);
      const q = query(playersRef, where('userId', '==', userId));
      const playerSnapshot = await getDocs(q);

      if (!playerSnapshot.empty) {
        const playerData = playerSnapshot.docs[0].data();
        const sweepData = sweepDoc.data();
        playerSweepstakes.push({
          id: sweepDoc.id,
          ownerId: sweepData.ownerId,
          name: sweepData.name,
          leagueCode: sweepData.leagueCode,
          type: sweepData.type || 'worldcup',
          enrollmentDeadline: sweepData.enrollmentDeadline.toDate(),
          tournamentYear: sweepData.tournamentYear,
          status: sweepData.status,
          winnerId: sweepData.winnerId,
          createdAt: sweepData.createdAt.toDate(),
          assignedTeam: playerData.assignedTeam,
          customOptions: sweepData.customOptions,
        });
      }
    }

    return playerSweepstakes;
  },

  async deleteSweepstake(sweepstakeId: string): Promise<void> {
    // Delete all players in this sweepstake first
    const playersRef = collection(db, `sweepstakes/${sweepstakeId}/players`);
    const playersSnapshot = await getDocs(playersRef);
    
    for (const playerDoc of playersSnapshot.docs) {
      await deleteDoc(playerDoc.ref);
    }

    // Delete the sweepstake document
    const sweepstakeRef = doc(db, 'sweepstakes', sweepstakeId);
    await deleteDoc(sweepstakeRef);
  },
};
