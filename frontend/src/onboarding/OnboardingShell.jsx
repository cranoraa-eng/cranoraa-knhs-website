import ContextualTip from './ContextualTip';
import GuidedTour from './GuidedTour';
import HelpCenter from './HelpCenter';
import OnboardingWelcome from './OnboardingWelcome';

const OnboardingShell = () => (
  <>
    <OnboardingWelcome />
    <GuidedTour />
    <ContextualTip />
    <HelpCenter />
  </>
);

export default OnboardingShell;
