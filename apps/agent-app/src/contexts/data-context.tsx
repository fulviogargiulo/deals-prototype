import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client, ClientWithOpportunities, Opportunity } from '@/types';
import { 
  mockClients, 
  mockOpportunities,
  mockTasks,
  mockDocuments,
  mockAgents
} from '@/data/mockData';
import { generateManyClients } from '@/data/generateMockClients';

export type DataViewMode = 'default' | 'empty' | 'few' | 'many';

interface DataContextType {
  dataViewMode: DataViewMode;
  setDataViewMode: (mode: DataViewMode) => void;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  opportunities: Opportunity[];
  getAllClientsWithOpportunities: () => ClientWithOpportunities[];
  getClientWithOpportunities: (clientId: string) => ClientWithOpportunities | undefined;
  getOpportunityById: (id: string) => Opportunity | undefined;
  getClientById: (id: string) => Client | undefined;
  updateClient: (clientId: string, updates: Partial<Client>) => void;
  addClient: (client: Client) => void;
  addOpportunity: (opportunity: Opportunity) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [dataViewMode, setDataViewMode] = useState<DataViewMode>('default');
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities);

  // Update clients and opportunities when view mode changes
  useEffect(() => {
    let newClients: Client[];
    let newOpportunities: Opportunity[];
    
    switch (dataViewMode) {
      case 'empty':
        newClients = [];
        newOpportunities = [];
        break;
      case 'few':
        newClients = mockClients.slice(0, 5);
        newOpportunities = mockOpportunities.filter(o => {
          const clientIds = mockClients.slice(0, 5).map(c => c.id);
          return clientIds.includes(o.clientId);
        });
        break;
      case 'many': {
        const manyClients = generateManyClients(150);
        newClients = manyClients.map(({ opportunities: _, ...client }) => client);
        newOpportunities = manyClients.flatMap(c => c.opportunities);
        break;
      }
      default:
        newClients = mockClients;
        newOpportunities = mockOpportunities;
    }
    
    setClients(newClients);
    setOpportunities(newOpportunities);
  }, [dataViewMode]);

  const getAllClientsWithOpportunities = (): ClientWithOpportunities[] => {
    return clients.map(client => ({
      ...client,
      opportunities: opportunities.filter(o => o.clientId === client.id),
    }));
  };

  const getClientWithOpportunities = (clientId: string): ClientWithOpportunities | undefined => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return undefined;
    
    const clientOpportunities = opportunities.filter(o => o.clientId === clientId);
    return { ...client, opportunities: clientOpportunities };
  };

  const getOpportunityById = (id: string): Opportunity | undefined => {
    return opportunities.find(o => o.id === id);
  };

  const getClientById = (id: string): Client | undefined => {
    return clients.find(c => c.id === id);
  };

  const updateClient = (clientId: string, updates: Partial<Client>) => {
    setClients(prevClients => 
      prevClients.map(client => 
        client.id === clientId ? { ...client, ...updates } : client
      )
    );
  };

  const addClient = (client: Client) => {
    setClients(prev => [client, ...prev]);
  };

  const addOpportunity = (opportunity: Opportunity) => {
    setOpportunities(prev => [opportunity, ...prev]);
  };

  return (
    <DataContext.Provider
      value={{
        dataViewMode,
        setDataViewMode,
        clients,
        setClients,
        opportunities,
        getAllClientsWithOpportunities,
        getClientWithOpportunities,
        getOpportunityById,
        getClientById,
        updateClient,
        addClient,
        addOpportunity,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

// Export static data that doesn't change with view mode
export { mockTasks, mockDocuments, mockAgents };
