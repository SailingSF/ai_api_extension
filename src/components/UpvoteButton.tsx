import React, { useState } from 'react';
import axios from 'axios';
import { ThumbsUp } from 'lucide-react';
import { useAuth } from '../AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL as string | undefined;

interface UpvoteButtonProps {
  imageId: number | string;
  initialVotes?: number;
  onVoteUpdate?: (newVotes: number) => void;
}

const UpvoteButton: React.FC<UpvoteButtonProps> = ({ imageId, initialVotes = 0, onVoteUpdate }) => {
  const { openAuthModal } = useAuth();
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [votes, setVotes] = useState<number>(initialVotes);

  const handleUpvote = async (): Promise<void> => {
    if (hasVoted) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // An alert() dead-ends here; the modal lets them vote without losing the page.
        openAuthModal('Log in to upvote images.');
        return;
      }

      if (!API_BASE_URL) {
        throw new Error('Missing REACT_APP_API_BASE_URL');
      }

      const config = { headers: { Authorization: `Token ${token}` } };
      const response = await axios.post(
        `${API_BASE_URL}/api/images/upvote/`,
        { image_id: imageId },
        config
      );

      if (response.status === 200) {
        setHasVoted(true);
        const newVotes = votes + 1;
        setVotes(newVotes);
        onVoteUpdate?.(newVotes);
      }
    } catch (error: any) {
      if (error?.response) {
        if (error.response.status === 401) {
          openAuthModal('Log in to upvote images.');
        } else if (error.response.status === 429) {
          setHasVoted(true);
        } else {
          // eslint-disable-next-line no-console
          console.error('Error upvoting:', error.response.data);
        }
      } else {
        // eslint-disable-next-line no-console
        console.error('Error upvoting:', error);
      }
    }
  };

  return (
    <button
      onClick={handleUpvote}
      className={`rounded-full p-2 ${hasVoted ? 'cursor-not-allowed bg-gray-300 text-gray-500' : 'bg-blue-500 text-white hover:bg-blue-600'} transition duration-300`}
      disabled={hasVoted}
      aria-label={hasVoted ? 'Already upvoted' : 'Upvote image'}
    >
      <ThumbsUp size={20} />
    </button>
  );
};

export default UpvoteButton;
