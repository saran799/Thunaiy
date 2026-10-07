import { Navigate, Route, Routes } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import OtpPage from './pages/OtpPage';
import LanguagePage from './pages/LanguagePage';
import BankPage from './pages/BankPage';
import FormSelectPage from './pages/FormSelectPage';
import PurposePage from './pages/PurposePage';
import ViewerPage from './pages/ViewerPage';
import CompletePage from './pages/CompletePage';
import HomePage from './pages/HomePage';
import FormsPage from './pages/FormsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/register" replace />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/otp" element={<OtpPage />} />
      <Route path="/language" element={<LanguagePage />} />
      <Route path="/bank" element={<BankPage />} />
      <Route path="/form" element={<FormSelectPage />} />
      <Route path="/purpose" element={<PurposePage />} />
      <Route path="/viewer" element={<ViewerPage />} />
      <Route path="/complete" element={<CompletePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/forms" element={<FormsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/register" replace />} />
    </Routes>
  );
}
