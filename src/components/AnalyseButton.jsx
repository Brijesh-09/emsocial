'use client';

import { useRouter } from 'next/navigation';

export default function AnalyseButton({ collectionName }) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/${collectionName}/reports`);
  };

  return (
    <button
      onClick={handleClick}
      className="text-2xl font-bold bg-gray-200 rounded-md py-2 px-4 cursor-pointer text-black hover:bg-gray-300"
    >
      Analyse
    </button>
  );
}
