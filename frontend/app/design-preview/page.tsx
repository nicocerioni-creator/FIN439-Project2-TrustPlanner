import type { Metadata } from 'next';
import { IllustrativePreview } from '@/components/planner/illustrative-preview';

export const metadata: Metadata = {
  title: 'Illustrative design preview · Trust support planner',
  robots: { index: false },
};

export default function DesignPreviewPage() {
  return <IllustrativePreview />;
}
