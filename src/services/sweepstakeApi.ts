import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Sweepstake {
  id: string;
  ownerId: string;
  name: string;
  leagueCode: string;
  enrollmentDeadline: Date;
  tournamentYear: number;
  status: 'active' | 'completed' | 'cancelled';
  winnerId: string | null;
  createdAt: Date;
}

export interface Player {
  id: string;
  sweepstakeId: string;
  userId: string;
  assignedTeam: string;
  paid: boolean;
  isEliminated: boolean;
  joinedAt: Date;
}

export const sweepstakeApi = {
  generateLeagueCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  },

  async createSweepstake(
    ownerId: string,
    name: string,
    enrollmentDeadline: Date
  ): Promise<Sweepstake> {
    const leagueCode = this.generateLeagueCode();

    const sweepstakeData = {
      ownerId,
      name,
      leagueCode,
      enrollmentDeadline: Timestamp.fromDate(enrollmentDeadline),
      tournamentYear: 2026,
      status: 'active',
      winnerId: null,
      createdAt: Timestamp.fromDate(new Date()),
    };

    const docRef = await addDoc(collection(db, 'sweepstakes'), sweepstakeData);

    return {
      id: docRef.id,
      ...sweepstakeData,
      enrollmentDeadline,
      createdAt: new Date(),
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
      enrollmentDeadline: data.enrollmentDeadline.toDate(),
      tournamentYear: data.tournamentYear,
      status: data.status,
      winnerId: data.winnerId,
      createdAt: data.createdAt.toDate(),
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
      name: data.name,
      leagueCode: data.leagueCode,
      enrollmentDeadline: data.enrollmentDeadline.toDate(),
      tournamentYear: data.tournamentYear,
      status: data.status,
      winnerId: data.winnerId,
      createdAt: data.createdAt.toDate(),
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
    team: string
  ): Promise<Player> {
    const playerData = {
      sweepstakeId,
      userId,
      assignedTeam: team,
      paid: false,
      isEliminated: false,
      joinedAt: Timestamp.fromDate(new Date()),
    };

    const docRef = await addDoc(collection(db, `sweepstakes/${sweepstakeId}/players`), playerData);

    return {
      id: docRef.id,
      ...playerData,
      joinedAt: new Date(),
    } as Player;
  },

  async getAvailableTeams(sweepstakeId: string): Promise<string[]> {
    const allTeams = [
      'United States', 'Canada', 'Mexico', 'Argentina', 'Brazil', 'France', 'Germany', 'England', 'Spain', 'Italy',
      'Netherlands', 'Portugal', 'Belgium', 'Uruguay', 'Croatia', 'Switzerland', 'Denmark', 'Poland', 'Senegal',
      'Morocco', 'Japan', 'South Korea', 'Australia', 'Iran', 'Saudi Arabia', 'Ecuador', 'Cameroon', 'Ghana',
      'Serbia', 'Tunisia', 'Costa Rica', 'Qatar', 'Egypt', 'Nigeria', 'Chile', 'Colombia', 'Peru', 'Turkey',
      'Czech Republic', 'Sweden', 'Norway', 'Ukraine', 'Greece', 'Algeria', 'Ivory Coast', 'South Africa',
      'New Zealand', 'United Arab Emirates'
    ];

    const playersSnapshot = await getDocs(
      collection(db, `sweepstakes/${sweepstakeId}/players`)
    );
    const assignedTeams = playersSnapshot.docs.map((doc) => doc.data().assignedTeam);

    return allTeams.filter((team) => !assignedTeams.includes(team));
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
        enrollmentDeadline: data.enrollmentDeadline.toDate(),
        tournamentYear: data.tournamentYear,
        status: data.status,
        winnerId: data.winnerId,
        createdAt: data.createdAt.toDate(),
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
          enrollmentDeadline: sweepData.enrollmentDeadline.toDate(),
          tournamentYear: sweepData.tournamentYear,
          status: sweepData.status,
          winnerId: sweepData.winnerId,
          createdAt: sweepData.createdAt.toDate(),
          assignedTeam: playerData.assignedTeam,
        });
      }
    }

    return playerSweepstakes;
  },
};
