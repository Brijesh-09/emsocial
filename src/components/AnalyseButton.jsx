'use client';

import { useRouter } from 'next/navigation';

export default function AnalyseButton({ collectionName }) {
  const router = useRouter();

  // const handleClick = () => {
  //   router.push(`/${collectionName}/reports`);
  //   console.log('Button clicked!');
  // };

  const analyseCollection = async () => {
    const response = await fetch(`/api/analyse/${collectionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Error analysing collection:', response.statusText);
      return;
    }

    const data = await response.json();
    console.log('Analysis result:', data);
    router.push(`/${collectionName}/reports`);
    console.log('Button clicked!');
  }

  return (
    <button
      onClick={analyseCollection}
      className="text-2xl font-bold bg-gray-200 rounded-md py-2 px-4 cursor-pointer text-black hover:bg-gray-300"
    >
      Analyse
    </button>
  );
}
