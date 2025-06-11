import { useEffect,useState } from 'react';
import './App.css';
import io from 'socket.io-client';
import {ToastContainer,toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const socket = io('https://quizclash-backend.onrender.com');


function App() {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [info, setInfo] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([]);
  const [scores, setScores] = useState([]);
  const [seconds, setSeconds] = useState();
  const [selectedAnswerIndex,setSelectedAnswerIndex] = useState(null);
  const [answered,setAnswered] = useState(false);
  const [winner,setWinner] = useState();


  function handlesubmit(e) {
    e.preventDefault();
    if (name && room) {
      setInfo(true);
    }
  }

  const handleAnswer = (answerIndex)=>{
    if(!answered){
      setSelectedAnswerIndex(answerIndex);
      socket.emit('submitAnswer',room,answerIndex);
      setAnswered(true);
    }
  }

  useEffect(()=>{
    if(seconds === 0)return;
    const timerInterval = setInterval(()=>{
      setSeconds(prevTime=>prevTime-1);
    },1000);
    return()=>{
      clearInterval(timerInterval)
    }
  },[seconds])

  // socket.io logic
  useEffect(()=>{
    if(name){
      socket.emit('joinRoom',room,name);
    }
  },[info]);

  useEffect(() => {
    socket.on('message', (message) => {
     
      toast(`${message} joined`,{
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        });


    });
    return ()=>{
      socket.off('message')
    }
  }, []);

  useEffect(()=>{
    socket.on('newQuestion',(data)=>{
      setQuestion(data.question);
      setOptions(data.answers);
      setSeconds(data.timer);
      setAnswered(false);
      setSelectedAnswerIndex();
    })

    socket.on('answerResult' , (data)=>{
      if(data.isCorrect){
        toast(`correct! ${data.playerName} got it right`,{
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        })
      }
      setScores(data.scores);
    })
    socket.on('gameOver',(data)=>{
      setWinner(data.winner);
    })
    return()=>{
      socket.off('newQuestion');
      socket.off('answerResult');
      socket.off('gameOver');
    }
  },[])

  if(winner){
    return(
      <h1>Winner is {winner}</h1>
    )
  }


  return (
    <div className="App">
      {!info ? (
        <div className="join-div">
          <h1>QuizClash</h1>
          <form onSubmit={handlesubmit}>
            <input
              required
              placeholder="Enter Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              required
              placeholder="Enter Room Code"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
            <button className="join-btn" type="submit">
              JOIN
            </button>
          </form>
        </div>
      ) : (
        <div>
          <h1>QuizClash</h1>
          <p className="room-id">Room Code: {room}</p>
          <ToastContainer />

          {question ? (
            <div className="quiz-div">
              <p>Remaining Time: {seconds}</p>

              <div className="question">
                <p className="question-text">{question}</p>
              </div>

              <ul>
                {options.map((answer, index) => (
                  <li key={index}>
                    <button onClick={()=>handleAnswer(index)} disabled={answered} className={`options ${selectedAnswerIndex === index ? 'selected':''} `}>{answer}</button>
                  </li>
                ))}
              </ul>

              {scores.map((player, index) => (
                <p key={index}>
                  {player.name}: {player.score}
                </p>
              ))}
            </div>
          ) : (
            <p>Loading Questions...</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
