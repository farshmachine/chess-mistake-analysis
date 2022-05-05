import { useCallback, useState } from 'react';
import { getMistakes } from './utils';
import './app.css';

function App() {
  const [pgn, setPgn] = useState('');
  const [result, setResult] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleInputChange = useCallback((e) => {
    setResult(null);
    setPgn(e.target.value);
    setProgress(0);
  }, []);

  const handleButtonClick = useCallback(async () => {
    setIsEvaluating(true);
    const { data } = await getMistakes(pgn, setProgress);
    setIsEvaluating(false);
    setResult(data);
  }, [pgn, setIsEvaluating]);

  return (
    <div className='container'>
      <textarea
        className='input'
        placeholder='Enter PGN'
        onChange={handleInputChange}
      />
      {progress > 0 && (
        <div
          style={{
            width: (500 / 10) * progress,
            height: 10,
            backgroundColor: 'blue',
          }}
        />
      )}
      <button onClick={handleButtonClick}>
        {isEvaluating ? 'Evaluating...' : 'Get evaluation'}
      </button>
      <span>Default depth search: 14</span>
      {result && JSON.stringify(result, null, 2)}
    </div>
  );
}

export default App;
