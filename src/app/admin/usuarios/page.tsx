'use client';
import { useState } from 'react';
import { Box, Container, Tabs, Tab } from '@mui/material';
import ReturnBtn from '@/components/ReturnBtn';
import UserList from '@/views/admin/users/UserList';
import ProfileList from '@/views/admin/profiles/ProfileList';
import GroupList from '@/views/admin/groups/GroupList';
import UnitList from '@/views/admin/units/UnitList';

export default function UserManagementPage() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <ReturnBtn title="Tela Inicial" url="/" />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label="Usuários" />
          <Tab label="Perfis" />
          <Tab label="Grupos" />
          <Tab label="Unidades" />
        </Tabs>

        {activeTab === 0 && <UserList />}
        {activeTab === 1 && <ProfileList />}
        {activeTab === 2 && <GroupList />}
        {activeTab === 3 && <UnitList />}
      </Container>
    </Box>
  );
}

