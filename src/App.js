// App.js - Main application file
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import SearchForm from './components/SearchForm';
import FlightResults from './components/FlightResults';
import Header from './components/Header';
import ConnectWallet from './components/ConnectWallet';
import BookingModal from './components/BookingModal';
import Footer from './components/Footer'; 
import { mockFlightData } from './data/mockFlights';

function App() {
  const [wallet, setWallet] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [error, setError] = useState(null);



  // Connect to MetaMask wallet
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        const balance = await provider.getBalance(address);

        setWallet({
          address,
          balance: ethers.utils.formatEther(balance),
          signer
        });
      } else {
        alert('Please install MetaMask to use this application');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // In App.js, update the handleSearch function

  const handleSearch = async (searchParams) => {
    setLoading(true);
    setSearchResults([]);

    try {
      // First, we need to find the airports for the cities
      const originAirports = await fetchAirports(searchParams.from);
      const destinationAirports = await fetchAirports(searchParams.to);

      if (originAirports.length === 0) {
        setError(`No airports found for "${searchParams.from}"`);
        setLoading(false);
        return;
      }

      if (destinationAirports.length === 0) {
        setError(`No airports found for "${searchParams.to}"`);
        setLoading(false);
        return;
      }

      // Clear previous errors if everything is fine
      setError(null);


      // Use the first airport from each search result
      const originIATA = originAirports[0].iataCode;
      const destinationIATA = destinationAirports[0].iataCode;

      // Format the date in the required format (YYYY-MM-DD)
      const formattedDepartDate = new Date(searchParams.departDate).toISOString().split('T')[0];

      // Fetch flights between these airports
      const flights = await fetchFlights(originIATA, destinationIATA, formattedDepartDate);

      setSearchResults(flights);
    } catch (error) {
      console.error('Error fetching flight data:', error);
      // Fallback to mock data if API fails
      const filteredResults = mockFlightData.filter(flight =>
        flight.departure.city.toLowerCase().includes(searchParams.from.toLowerCase()) &&
        flight.arrival.city.toLowerCase().includes(searchParams.to.toLowerCase())
      );
      setSearchResults(filteredResults);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch airports by city name
  // Update fetchAirports function
  const fetchAirports = async (cityName) => {
    try {
      const response = await fetch(`/api/airports?city=${encodeURIComponent(cityName)}`);
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching airports:', error);
      return [];
    }
  };

  // Update fetchFlights function similarly


  // Function to fetch flights between airports
  const fetchFlights = async (originIATA, destinationIATA, date) => {
    // AeroDataBox doesn't directly provide flight search between airports
    // Instead, we'll fetch schedules for the origin airport and filter for our destination
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.REACT_APP_RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
      }
    };

    try {
      // Get departures from origin airport
      const response = await fetch(`https://aerodatabox.p.rapidapi.com/flights/airports/iata/${originIATA}/${date}?withLeg=true&withCancelled=false&withCodeshared=true&withCargo=false&withPrivate=false&withLocation=false`, options);
      const data = await response.json();

      // Filter flights going to our destination
      const matchingFlights = data.departures.filter(flight =>
        flight.arrival.airport.iata === destinationIATA
      );

      // Transform the data into our application's format
      return matchingFlights.map((flight, index) => {
        // Calculate a price based on distance (this is mock pricing)
        const basePrice = 150 + (Math.random() * 300);
        const price = Math.round(basePrice);
        const ethPrice = (price / 3000).toFixed(4);

        return {
          id: `FL${index + 100}`,
          airline: {
            name: flight.airline.name,
            logo: `/api/placeholder/30/30` // AeroDataBox doesn't provide airline logos
          },
          departure: {
            city: flight.departure.airport.municipalityName || flight.departure.airport.name,
            airport: flight.departure.airport.iata,
            time: new Date(flight.departure.scheduledTimeLocal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          arrival: {
            city: flight.arrival.airport.municipalityName || flight.arrival.airport.name,
            airport: flight.arrival.airport.iata,
            time: new Date(flight.arrival.scheduledTimeLocal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          duration: calculateDuration(
            new Date(flight.departure.scheduledTimeLocal),
            new Date(flight.arrival.scheduledTimeLocal)
          ),
          stops: 0, // Direct flights
          date: date,
          price: {
            fiat: price,
            eth: parseFloat(ethPrice)
          }
        };
      });
    } catch (error) {
      console.error('Error fetching flights:', error);
      return [];
    }
  };

  // Helper function to calculate flight duration
  const calculateDuration = (departureTime, arrivalTime) => {
    const diff = arrivalTime - departureTime; // difference in milliseconds
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };
  const handleSelectFlight = (flight) => {
    setSelectedFlight(flight);
    setShowModal(true);
  };

  const handleBooking = async (paymentDetails) => {
    if (!wallet) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // In a production app, this would interact with a smart contract
      const tx = await wallet.signer.sendTransaction({
        to: paymentDetails.contractAddress,
        value: ethers.utils.parseEther(paymentDetails.amount.toString())
      });

      alert(`Booking successful! Transaction hash: ${tx.hash}`);
      setShowModal(false);
      setSelectedFlight(null);
    } catch (error) {
      console.error('Transaction failed:', error);
      alert('Booking failed. Please try again.');
    }
  };
  console.log(error);
  return (
    <div className="app">
      <Header />
      <ConnectWallet wallet={wallet} connectWallet={connectWallet} />
      <div className="container">
        <SearchForm onSearch={handleSearch} />
        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Searching for the best flights...</div>
        ) : (
          <FlightResults
            results={searchResults}
            onSelectFlight={handleSelectFlight}
            wallet={wallet}
          />
        )}
      </div>

      {showModal && selectedFlight && (
        <BookingModal
          flight={selectedFlight}
          wallet={wallet}
          onClose={() => setShowModal(false)}
          onConfirm={handleBooking}
        />
      )}
              <Footer githubRepo="https://github.com/ritik4ever/crypto-travel" />
    </div>
  );
}

export default App;
