import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Avatar,
  Box,
  Chip,
  InputAdornment,
  List,
  ListItem,
  TextField,
  Typography,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import axiosInstance from '../../api/axiosInstance';

const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try {
    return JSON.parse(tags);
  } catch {
    return [];
  }
};

const baseTerms = ['#오오티디', '#캐주얼', '#스트릿', '#테크웨어', '#아메카지', '#워크웨어', '#데일리룩', '#미니멀'];

const Panel = ({ title, count, children }) => (
  <Box sx={{
    minHeight: { md: 'calc(100vh - 220px)' },
    border: '1px solid #141414',
    borderRadius: '16px',
    backgroundColor: '#0A0A0A',
    overflow: 'hidden',
  }}>
    <Box sx={{
      height: 46,
      px: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid #141414',
    }}>
      <Typography fontWeight={800} fontSize={14} sx={{ color: '#F2F2F2' }}>
        {title}
      </Typography>
      {count !== undefined && (
        <Typography fontSize={12} sx={{ color: '#5A5A5A' }}>
          {count}
        </Typography>
      )}
    </Box>
    <Box sx={{ p: 1.2 }}>
      {children}
    </Box>
  </Box>
);

const Empty = ({ text }) => (
  <Box sx={{
    minHeight: 150,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <Typography fontSize={13} sx={{ color: '#555' }}>
      {text}
    </Typography>
  </Box>
);

const Search = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [results, setResults] = useState({ users: [], posts: [] });

  // URL의 q 파라미터로 초기 검색 실행
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) runSearch(q);
  }, []);

  const runSearch = async (value) => {
    setQuery(value);
    if (!value.trim()) {
      setResults({ users: [], posts: [] });
      return;
    }

    try {
      const res = await axiosInstance.get(`/users/search?q=${encodeURIComponent(value)}`);
      setResults({
        users: res.data.users || [],
        posts: res.data.posts || [],
      });
    } catch {
      setResults({ users: [], posts: [] });
    }
  };

  const postRows = useMemo(() => results.posts.map(post => {
    const tags = parseTags(post.tags)
      .slice(0, 3)
      .map(tag => String(tag).startsWith('#') ? tag : `#${tag}`)
      .join(' ');

    return {
      ...post,
      titleText: post.title || post.content || '게시글',
      metaText: [post.username, post.style, tags].filter(Boolean).join(' · '),
    };
  }), [results.posts]);

  const hasQuery = query.trim().length > 0;
  const hasResults = results.users.length > 0 || results.posts.length > 0;
  const relatedTerms = query.trim()
    ? [query.trim(), `#${query.trim().replace(/^#/, '')}`, `${query.trim()} 코디`, `${query.trim()} 스타일`]
    : baseTerms.slice(0, 4);
  const popularTerms = [...new Set([...relatedTerms, ...baseTerms])].slice(0, 10);

  return (
    <Box sx={{
      width: '100%',
      maxWidth: 1320,
      mx: 'auto',
      px: { xs: 2, md: 4, xl: 5 },
      py: 3,
      minHeight: '100vh',
      backgroundColor: '#080808',
    }}>
      <Box sx={{
        mb: 3,
        p: { xs: 2, md: 2.5 },
        borderRadius: '18px',
        border: '1px solid #161616',
        backgroundColor: '#0B0B0B',
      }}>
        <Box sx={{ mb: 2 }}>
          <Typography fontWeight={900} fontSize={26} sx={{ color: '#F5F5F5', lineHeight: 1.15 }}>
            검색
          </Typography>
          <Typography fontSize={13} sx={{ color: '#555', mt: 0.7 }}>
            닉네임, 해시태그, 제목과 내용을 한 번에 찾아보세요.
          </Typography>
        </Box>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(420px, 720px) 1fr' },
          gap: { xs: 1.5, lg: 3 },
          alignItems: 'center',
        }}>
          <TextField
            fullWidth
            placeholder="닉네임, 태그, 제목, 내용 검색"
            value={query}
            onChange={(e) => runSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#E8C96D', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                height: 46,
                borderRadius: '999px',
                backgroundColor: '#111',
                color: '#F5F5F5',
                border: '1px solid #242424',
                transition: 'all 0.18s ease',
                '& fieldset': { border: 'none' },
                '&:hover': {
                  backgroundColor: '#141414',
                  borderColor: '#343434',
                },
                '&.Mui-focused': {
                  backgroundColor: '#151515',
                  borderColor: 'rgba(232,201,109,0.55)',
                  boxShadow: '0 0 0 3px rgba(232,201,109,0.08)',
                },
              },
              '& input': {
                fontSize: 15,
                color: '#F5F5F5',
                '&::placeholder': { color: '#696969', opacity: 1 },
              },
            }}
          />

          <Box sx={{
            display: 'flex',
            justifyContent: { xs: 'flex-start', lg: 'flex-end' },
            gap: 0.8,
            flexWrap: 'wrap',
          }}>
            {relatedTerms.map(term => (
              <Chip
                key={term}
                label={term}
                onClick={() => runSearch(term)}
                sx={{
                  height: 30,
                  borderRadius: '999px',
                  backgroundColor: 'rgba(232,201,109,0.06)',
                  color: '#A0A0A0',
                  border: '1px solid rgba(232,201,109,0.16)',
                  fontWeight: 700,
                  '&:hover': {
                    backgroundColor: 'rgba(232,201,109,0.12)',
                    color: '#E8C96D',
                    borderColor: 'rgba(232,201,109,0.35)',
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {!hasQuery && (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 0.8fr' },
          gap: 2,
        }}>
          <Panel title="검색 시작">
            <Box sx={{
              minHeight: { xs: 180, md: 'calc(100vh - 280px)' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              px: 3,
            }}>
              <Typography sx={{ color: '#666', fontSize: 14 }}>
                닉네임, 해시태그, 제목, 내용으로 피드를 찾아보세요.
              </Typography>
            </Box>
          </Panel>
          <Panel title="추천 검색어">
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {popularTerms.map(term => (
                <Chip
                  key={term}
                  label={term}
                  onClick={() => runSearch(term)}
                  sx={{
                    backgroundColor: '#111',
                    color: '#A0A0A0',
                    border: '1px solid #1C1C1C',
                    '&:hover': { backgroundColor: '#171717', color: '#E8C96D' },
                  }}
                />
              ))}
            </Box>
          </Panel>
          <Panel title="인기 태그">
            <List disablePadding>
              {baseTerms.slice(0, 6).map((term, index) => (
                <ListItem
                  key={term}
                  onClick={() => runSearch(term)}
                  sx={{
                    px: 1,
                    py: 1.1,
                    cursor: 'pointer',
                    borderRadius: 2,
                    '&:hover': { backgroundColor: '#111' },
                  }}>
                  <Typography fontWeight={800} fontSize={13} sx={{ color: '#555', width: 28 }}>
                    {index + 1}
                  </Typography>
                  <Typography fontSize={14} sx={{ color: '#BDBDBD' }}>
                    {term}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Panel>
        </Box>
      )}

      {hasQuery && !hasResults && (
        <Panel title="검색 결과" count={0}>
          <Box sx={{
            minHeight: { xs: 220, md: 'calc(100vh - 280px)' },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}>
            <Typography fontWeight={800} sx={{ color: '#F0F0F0', mb: 0.6 }}>
              검색 결과가 없습니다
            </Typography>
            <Typography sx={{ color: '#666', fontSize: 13 }}>
              다른 키워드를 입력해보세요.
            </Typography>
          </Box>
        </Panel>
      )}

      {hasResults && (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '340px minmax(0, 1fr) 260px' },
          gap: 2,
          alignItems: 'stretch',
        }}>
          <Panel title="계정" count={results.users.length}>
            {results.users.length === 0 ? (
              <Empty text="일치하는 계정이 없습니다." />
            ) : (
              <List disablePadding>
                {results.users.map(user => (
                  <ListItem
                    key={user.id}
                    onClick={() => navigate(`/profile/${user.username}`)}
                    sx={{
                      px: 1,
                      py: 1.1,
                      gap: 1.4,
                      cursor: 'pointer',
                      borderRadius: 2,
                      '&:hover': { backgroundColor: '#111' },
                    }}>
                    <Avatar
                      src={user.profile_image ? `http://localhost:5000${user.profile_image}` : null}
                      sx={{
                        width: 50,
                        height: 50,
                        flexShrink: 0,
                        bgcolor: '#1A1A1A',
                        color: '#E8C96D',
                        fontWeight: 900,
                        border: '1px solid #262626',
                      }}>
                      {user.username?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={900} fontSize={14} noWrap sx={{ color: '#F5F5F5' }}>
                        {user.username}
                      </Typography>
                      <Typography fontSize={13} noWrap sx={{ color: '#8E8E8E', lineHeight: 1.35 }}>
                        {user.bio || user.preferred_style || '닉네임 검색 결과'}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Panel>

          <Panel title="게시글" count={postRows.length}>
            {postRows.length === 0 ? (
              <Empty text="일치하는 게시글이 없습니다." />
            ) : (
              <List disablePadding sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' },
                gap: 1,
              }}>
                {postRows.map(post => (
                  <ListItem
                    key={post.id}
                    onClick={() => navigate(`/post/${post.id}`)}
                    sx={{
                      px: 1,
                      py: 1.1,
                      gap: 1.4,
                      cursor: 'pointer',
                      borderRadius: 2,
                      '&:hover': { backgroundColor: '#111' },
                    }}>
                    <Avatar
                      src={post.thumbnail ? `http://localhost:5000${post.thumbnail}` : null}
                      variant="rounded"
                      sx={{
                        width: 58,
                        height: 58,
                        flexShrink: 0,
                        bgcolor: '#151515',
                        color: '#E8C96D',
                        fontWeight: 900,
                        borderRadius: '9px',
                      }}>
                      #
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={900} fontSize={14} noWrap sx={{ color: '#F5F5F5' }}>
                        {post.titleText}
                      </Typography>
                      <Typography fontSize={13} noWrap sx={{ color: '#8E8E8E', lineHeight: 1.35 }}>
                        {post.metaText}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Panel>

          <Panel title="추천 검색어">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {popularTerms.map(term => (
                  <Chip
                    key={term}
                    label={term}
                    onClick={() => runSearch(term)}
                    sx={{
                      height: 28,
                      backgroundColor: '#111',
                      color: '#A0A0A0',
                      border: '1px solid #1C1C1C',
                      '&:hover': { backgroundColor: '#171717', color: '#E8C96D' },
                    }}
                  />
                ))}
              </Box>
              <Box>
                <Typography fontWeight={800} fontSize={13} sx={{ color: '#F2F2F2', mb: 1 }}>
                  인기 태그
                </Typography>
                <List disablePadding>
                  {baseTerms.slice(0, 5).map((term, index) => (
                    <ListItem
                      key={term}
                      onClick={() => runSearch(term)}
                      sx={{
                        px: 0,
                        py: 0.8,
                        cursor: 'pointer',
                        borderRadius: 2,
                        '&:hover': { backgroundColor: '#111' },
                      }}>
                      <Typography fontWeight={800} fontSize={12} sx={{ color: '#555', width: 24 }}>
                        {index + 1}
                      </Typography>
                      <Typography fontSize={13} sx={{ color: '#BDBDBD' }}>
                        {term}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>
          </Panel>
        </Box>
      )}
    </Box>
  );
};

export default Search;
