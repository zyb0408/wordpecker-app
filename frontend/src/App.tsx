import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, Box } from '@chakra-ui/react';
import theme from './theme';
import { Lists } from './pages/Lists';
import { ListDetail } from './pages/ListDetail';
import { Learn } from './pages/Learn';
import { Quiz } from './pages/Quiz';
import { TemplateLibrary } from './pages/TemplateLibrary';
import { WordDetailPage } from './pages/WordDetail';
import { Settings } from './pages/Settings';
import { ImageDescription } from './pages/ImageDescription';
import { GetNewWords } from './pages/GetNewWords';
import { WordLearningSession } from './pages/WordLearningSession';
import { ReadingPage } from './pages/ReadingPage';
import { VoiceChat } from './pages/VoiceChat';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Header } from './components/Header';

// Simple Auth Guard
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const tenantId = localStorage.getItem('wordpecker-tenant-id');
  if (!tenantId) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Box bg="slate.900" minH="100vh" color="white">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <>
                    <Header />
                    <Routes>
                      <Route path="/" element={<Navigate to="/lists" replace />} />
                      <Route path="/lists" element={<Lists />} />
                      <Route path="/lists/:id" element={<ListDetail />} />
                      <Route path="/learn/:id" element={<Learn />} />
                      <Route path="/quiz/:id" element={<Quiz />} />
                      <Route path="/templates" element={<TemplateLibrary />} />
                      <Route path="/words/:wordId" element={<WordDetailPage />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/describe" element={<ImageDescription />} />
                      <Route path="/learn-new-words" element={<GetNewWords />} />
                      <Route path="/learn-new-words/session" element={<WordLearningSession />} />
                      <Route path="/reading/:listId" element={<ReadingPage />} />
                      <Route path="/voice-chat/:listId" element={<VoiceChat />} />
                    </Routes>
                  </>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Box>
      </Router>
    </ChakraProvider>
  );
}

export default App;
