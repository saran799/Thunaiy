import { useEffect } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { AppStateProvider, useAppState } from '../../state/AppStateContext';
import { useServices } from '../../services/ServicesProvider';
import LanguagePage from '../LanguagePage';
import BankPage from '../BankPage';
import FormSelectPage from '../FormSelectPage';
import PurposePage from '../PurposePage';
import ViewerPage from '../ViewerPage';
import Screen from '../../components/Screen';
import StatePanel from '../../components/states/StatePanel';
import { useAsync } from '../../hooks/useAsync';
import { useTranslation } from '../../i18n/I18nProvider';

function AssistFlowContainer() {
  const { branchId } = useParams<{ branchId: string }>();
  const services = useServices();
  const { state, selectBank } = useAppState();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const data = useAsync(async () => {
    if (!branchId) return null;
    return services.branch.getBranch(branchId);
  }, [services, branchId]);

  useEffect(() => {
    if (data.data?.bankId && !state.selections.bankId) {
      selectBank(data.data.bankId);
    }
  }, [data.data, selectBank, state.selections.bankId]);

  if (data.loading || (data.data?.bankId && !state.selections.bankId)) {
    return (
      <Screen>
        <StatePanel variant="loading" title={t('common.loading')} />
      </Screen>
    );
  }

  if (data.error || (!data.loading && !data.data)) {
    return (
      <Screen>
        <StatePanel
          variant="error"
          title={t('common.errorTitle')}
          body="This QR code is invalid or the branch could not be found."
        />
      </Screen>
    );
  }

  const base = `/assist/${branchId}`;

  return (
    <Routes>
      <Route path="language" element={<LanguagePage nextRoute={`${base}/form`} backRoute="/" />} />
      <Route path="bank" element={<BankPage nextRoute={`${base}/form`} backRoute={`${base}/language`} />} />
      <Route path="form" element={<FormSelectPage nextRoute={`${base}/purpose`} backRoute={`${base}/bank`} errorRoute={`${base}/bank`} />} />
      <Route path="purpose" element={<PurposePage nextRoute={`${base}/viewer`} backRoute={`${base}/form`} errorRoute={`${base}/form`} />} />
      <Route path="viewer" element={<ViewerPage completeRoute={`${base}/complete`} backRoute={`${base}/purpose`} errorRoute={`${base}/form`} />} />
      <Route path="complete" element={
        <Screen className="flex items-center justify-center pt-20">
           <StatePanel variant="empty" title="Done!" body="You have completed this form." actionLabel="Start again" onAction={() => navigate(`${base}/language`)} />
        </Screen>
      } />
      <Route index element={<LanguagePage nextRoute={`${base}/form`} backRoute="/" />} />
    </Routes>
  );
}

export default function AssistFlow() {
  return (
    <AppStateProvider persist={false}>
      <AssistFlowContainer />
    </AppStateProvider>
  );
}

