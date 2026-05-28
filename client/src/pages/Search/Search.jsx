import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, InputAdornment,
  Avatar, Typography, List, ListItem,
  ListItemAvatar, ListItemText,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import axiosInstance from '../../api/axiosInstance';

const Search = () => {
  const navigate          = useNavigate();
  const [query, setQuery]   = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async (e) => {
    const q = e.target.value;
    setQuery(q);
    if (!q.trim()) return setResults([]);
    try {
      const res = await axiosInstance.get(`/users/search?q=${q}`);
      setResults(res.data);
    } catch {}
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, py: 3 }}>
      <TextField fullWidth placeholder="유저 검색..."
        value={query} onChange={handleSearch}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: '#A0A0A0' }} />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />
      <List>
        {results.map(user => (
          <ListItem key={user.id} button
            onClick={() => navigate(`/profile/${user.username}`)}
            sx={{ borderRadius: 2, '&:hover': { backgroundColor: '#1A1A1A' } }}>
            <ListItemAvatar>
              <Avatar src={user.profile_image ? `http://localhost:5000${user.profile_image}` : null}>
                {user.username[0].toUpperCase()}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={user.username}
              secondary={user.bio || ''}
              secondaryTypographyProps={{ color: '#A0A0A0' }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Search;