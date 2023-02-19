import React, { useState, useEffect } from "react";
import { navigate } from "@reach/router";
import { art_data } from '../art_data'
import { notion, useNotion } from "../services/notion";
import axios from 'axios';


const basePrompt = " "


function generateImage(modelId, prompt) {
  const apiUrl = `https://api.leapml.dev/api/v1/images/models/${modelId}/inferences`;

  const payload = {
    prompt: prompt,
    steps: 50,
    width: 512,
    height: 512,
    numberOfImages: 1,
    seed: 4523184,
  };

  const headers = {
    accept: "application/json",
    "content-type": "application/json",
    authorization: `Bearer 819306cb-3a34-4442-83e2-0e263a892943`,
  };

  return axios.post(apiUrl, payload, { headers });
}

async function getInference(modelId, inferenceId) {
  const url = `https://api.leapml.dev/api/v1/images/models/${modelId}/inferences/${inferenceId}`;
  const headers = {
    "accept": "application/json",
    "authorization": "Bearer {YOUR_API_KEY}"
  };

  const response = await fetch(url, { headers });
  const data = await response.json();

  console.log(data);
}



export function Focus() {
  const { user } = useNotion();
  const [focus, setFocus] = useState(0);

  const baseURL = "https://leap-hack.s3.amazonaws.com/"
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [art, setArt] = useState(art_data)
  const [focusScore, setFocusScore] = useState(0)
  const [readingCount, setReadingCount] = useState(0)
  const [state, setState] = useState("awaiting")
  const [focusSum, setFocusSum] = useState(0)

  const updateArt = (id, attentionScore) => {
    const updatedArt = art.map(artwork => {
      if (artwork.id === id){
        return { ... artwork, attentionScore: attentionScore}
      }
      return artwork
    }) 
    setArt(updatedArt)
  }

  const nextImage = () => {
    if (currentImageIndex < art.length-1){
      let attentionScore = 0
      if (focusSum && readingCount)
        attentionScore = focusSum/readingCount
      else
        attentionScore = 0

      updateArt(currentImageIndex, attentionScore)
      setCurrentImageIndex(currentImageIndex+1)
      setReadingCount(0) 
      setFocusSum(0)
    } 
    else if (currentImageIndex == art.length-1 && state === "presenting"){
    
      console.log("state: " + state)
      console.log("currentImageIndex == art.length")
      setCurrentImageIndex(currentImageIndex+1)
      handleGenerateImage()

    } else {
      // break interval loop
    }
  }    
    



  useEffect(() => {
    // Set up the interval to update the image every 5 seconds
    const intervalId = setInterval(() => {
      // Increment the current image index, looping back to 0 if at end of array
      // setCurrentImageIndex((currentImageIndex + 1) % art.length);
      nextImage()
    }, 3000);

    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, [currentImageIndex]);


  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const subscription = notion.focus().subscribe((focus) => {
      const focusScore = Math.trunc(focus.probability * 100);
      setFocus(focusScore);
      setFocusSum(focusSum + focusScore)
      setReadingCount(readingCount+1)
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const start = () => {
    setCurrentImageIndex(0)
    setState("presenting")
    setFocusSum(0)
  }


  function rankArt(arr) {
    return arr.sort((a, b) => b.attentionScore - a.attentionScore);
  }
  
  const [imageData, setImageData] = useState(null);
  const [error, setError] = useState(null);
  const [intervalId, setIntervalId] = useState(null);

  function stopPolling() {
    clearInterval(intervalId);
    setIntervalId(null);
  }

  const handleGenerateImage = () => {
    const rankedArt = rankArt(art)
    const modelId = rankedArt[0].modelId
    const prompt = rankedArt[1].subject + " " + rankedArt[2].seed + basePrompt



    generateImage(modelId, prompt)
      .then((response) => {
        const intervalId = setInterval(() =>pollEndpoint( modelId, response.data.id ), 3000); 
        setIntervalId(intervalId)
        return () => clearInterval(intervalId);
        // fetchData(modelId, response.data.id, );
        console.log(response.data.id)
        
        setError(null);
      })
      .catch((error) => {
        setError(error);
        setImageData(null);
      });
  };


  function pollEndpoint(modelId, inferenceId) {
    const url = `https://api.leapml.dev/api/v1/images/models/${modelId}/inferences/${inferenceId}`;
    const headers = {
      "accept": "application/json",
      "authorization": "Bearer 819306cb-3a34-4442-83e2-0e263a892943"
    };
  
    fetch(url, { headers })
      .then(response => {
        if (response.ok) {
          return response.json()
        } else {
          throw new Error('Failed to fetch response');
        }
      })
      .then(data => {
        console.log("Data.state: " + JSON.stringify(data.state))
        
        if (data.state === "finished"){
          console.log("finished")
          console.log("data.uri: " + data.uri) 
          setImageData(data);
          stopPolling()
        }
      })
      .catch(error => {
        console.log(".catch")
        // Handle the error
        console.error(error);
      });
  }


  return (
    <div className="grid place-content-center w-full h-screen">
      {
        state === "awaiting" && (
          <div className="border-2 border-indigo-600"> 
          <button
            className="text-white border-4 bg-white"
            onClick={start}>
            Click here to start
          </button>
          </div>
        )
      }
      {
        state === "presenting" && (currentImageIndex < art.length) && (
          
          <div
            onClick={nextImage}>
            <img
              className="w-1/2 mx-auto"  
              src={baseURL + art[currentImageIndex].url} />
          </div>
          
        )
      }
      {
        (currentImageIndex === art.length) && (!imageData) &&(
          
          <div>
            Generating...
          </div>
          
        )
      }
      {error && <p>Error: {error.message}</p>}
      {imageData && (
        <div>
          <img src={imageData.images[0].uri} alt="Generated Image" />
        </div>
      )}
      
    </div>
  );
}
