// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FlightBookingContract
 * @dev Manages flight bookings with cryptocurrency payments
 */
contract FlightBookingContract is Ownable {
    // Flight structure
    struct Flight {
        string id;
        string departureCity;
        string arrivalCity;
        string departureTime;
        string arrivalTime;
        string date;
        uint256 priceInWei;
        uint256 availableSeats;
        bool isActive;
    }

    // Booking structure
    struct Booking {
        address traveler;
        string flightId;
        uint256 passengers;
        uint256 totalPrice;
        uint256 bookingTime;
        bool isRefunded;
    }

    // Mapping of flight IDs to Flight structs
    mapping(string => Flight) public flights;

    // Array of all flight IDs
    string[] public flightIds;

    // Mapping of booking IDs to Booking structs
    mapping(uint256 => Booking) public bookings;

    // Counter for booking IDs
    uint256 public bookingCounter;

    // Supported ERC20 tokens for payment
    mapping(address => bool) public supportedTokens;

    // Events
    event FlightAdded(string flightId);
    event FlightUpdated(string flightId);
    event FlightRemoved(string flightId);
    event BookingCreated(
        uint256 bookingId,
        address traveler,
        string flightId,
        uint256 passengers
    );
    event BookingRefunded(uint256 bookingId);
    event TokenAdded(address tokenAddress);
    event TokenRemoved(address tokenAddress);

    /**
     * @dev Constructor
     */
    constructor() {
        bookingCounter = 1;
    }

    /**
     * @dev Add a new flight
     * @param _id Flight ID
     * @param _departureCity Departure city
     * @param _arrivalCity Arrival city
     * @param _departureTime Departure time
     * @param _arrivalTime Arrival time
     * @param _date Flight date
     * @param _priceInWei Price in Wei
     * @param _availableSeats Number of available seats
     */
    function addFlight(
        string memory _id,
        string memory _departureCity,
        string memory _arrivalCity,
        string memory _departureTime,
        string memory _arrivalTime,
        string memory _date,
        uint256 _priceInWei,
        uint256 _availableSeats
    ) external onlyOwner {
        require(bytes(flights[_id].id).length == 0, "Flight already exists");

        flights[_id] = Flight({
            id: _id,
            departureCity: _departureCity,
            arrivalCity: _arrivalCity,
            departureTime: _departureTime,
            arrivalTime: _arrivalTime,
            date: _date,
            priceInWei: _priceInWei,
            availableSeats: _availableSeats,
            isActive: true
        });

        flightIds.push(_id);
        emit FlightAdded(_id);
    }

    /**
     * @dev Update an existing flight
     * @param _id Flight ID
     * @param _priceInWei New price in Wei
     * @param _availableSeats New number of available seats
     * @param _isActive Whether the flight is active
     */
    function updateFlight(
        string memory _id,
        uint256 _priceInWei,
        uint256 _availableSeats,
        bool _isActive
    ) external onlyOwner {
        require(bytes(flights[_id].id).length > 0, "Flight does not exist");

        Flight storage flight = flights[_id];
        flight.priceInWei = _priceInWei;
        flight.availableSeats = _availableSeats;
        flight.isActive = _isActive;

        emit FlightUpdated(_id);
    }

    /**
     * @dev Remove a flight
     * @param _id Flight ID
     */
    function removeFlight(string memory _id) external onlyOwner {
        require(bytes(flights[_id].id).length > 0, "Flight does not exist");

        // Set flight as inactive instead of deleting
        flights[_id].isActive = false;

        emit FlightRemoved(_id);
    }

    /**
     * @dev Book a flight with ETH
     * @param _flightId Flight ID
     * @param _passengers Number of passengers
     */
    function bookFlightWithEth(
        string memory _flightId,
        uint256 _passengers
    ) external payable {
        Flight storage flight = flights[_flightId];
        require(bytes(flight.id).length > 0, "Flight does not exist");
        require(flight.isActive, "Flight is not active");
        require(
            flight.availableSeats >= _passengers,
            "Not enough seats available"
        );

        uint256 totalPrice = flight.priceInWei * _passengers;
        require(msg.value >= totalPrice, "Insufficient payment");

        // Create booking
        bookings[bookingCounter] = Booking({
            traveler: msg.sender,
            flightId: _flightId,
            passengers: _passengers,
            totalPrice: totalPrice,
            bookingTime: block.timestamp,
            isRefunded: false
        });

        // Update available seats
        flight.availableSeats -= _passengers;

        // Refund excess payment
        uint256 excess = msg.value - totalPrice;
        if (excess > 0) {
            payable(msg.sender).transfer(excess);
        }

        emit BookingCreated(bookingCounter, msg.sender, _flightId, _passengers);
        bookingCounter++;
    }

    /**
     * @dev Book a flight with ERC20 token
     * @param _flightId Flight ID
     * @param _passengers Number of passengers
     * @param _tokenAddress Address of the ERC20 token
     * @param _tokenAmount Amount of tokens to pay
     */
    function bookFlightWithToken(
        string memory _flightId,
        uint256 _passengers,
        address _tokenAddress,
        uint256 _tokenAmount
    ) external {
        require(supportedTokens[_tokenAddress], "Token not supported");

        Flight storage flight = flights[_flightId];
        require(bytes(flight.id).length > 0, "Flight does not exist");
        require(flight.isActive, "Flight is not active");
        require(
            flight.availableSeats >= _passengers,
            "Not enough seats available"
        );

        // Transfer tokens from user to contract
        IERC20 token = IERC20(_tokenAddress);
        require(
            token.transferFrom(msg.sender, address(this), _tokenAmount),
            "Token transfer failed"
        );

        // Create booking
        bookings[bookingCounter] = Booking({
            traveler: msg.sender,
            flightId: _flightId,
            passengers: _passengers,
            totalPrice: _tokenAmount,
            bookingTime: block.timestamp,
            isRefunded: false
        });

        // Update available seats
        flight.availableSeats -= _passengers;

        emit BookingCreated(bookingCounter, msg.sender, _flightId, _passengers);
        bookingCounter++;
    }

    /**
     * @dev Refund a booking
     * @param _bookingId Booking ID
     */
    function refundBooking(uint256 _bookingId) external onlyOwner {
        Booking storage booking = bookings[_bookingId];
        require(booking.traveler != address(0), "Booking does not exist");
        require(!booking.isRefunded, "Booking already refunded");

        // Mark as refunded
        booking.isRefunded = true;

        // Restore available seats
        Flight storage flight = flights[booking.flightId];
        flight.availableSeats += booking.passengers;

        // Transfer ETH back to traveler
        payable(booking.traveler).transfer(booking.totalPrice);

        emit BookingRefunded(_bookingId);
    }

    /**
     * @dev Add a supported ERC20 token
     * @param _tokenAddress Address of the ERC20 token
     */
    function addSupportedToken(address _tokenAddress) external onlyOwner {
        supportedTokens[_tokenAddress] = true;
        emit TokenAdded(_tokenAddress);
    }

    /**
     * @dev Remove a supported ERC20 token
     * @param _tokenAddress Address of the ERC20 token
     */
    function removeSupportedToken(address _tokenAddress) external onlyOwner {
        supportedTokens[_tokenAddress] = false;
        emit TokenRemoved(_tokenAddress);
    }

    /**
     * @dev Get all flight IDs
     * @return Array of flight IDs
     */
    function getAllFlightIds() external view returns (string[] memory) {
        return flightIds;
    }

    /**
     * @dev Get active flights
     * @return Array of active flight IDs
     */
    function getActiveFlights() external view returns (string[] memory) {
        uint256 activeCount = 0;

        // Count active flights
        for (uint256 i = 0; i < flightIds.length; i++) {
            if (flights[flightIds[i]].isActive) {
                activeCount++;
            }
        }

        // Create array of active flight IDs
        string[] memory activeFlights = new string[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < flightIds.length; i++) {
            if (flights[flightIds[i]].isActive) {
                activeFlights[index] = flightIds[i];
                index++;
            }
        }

        return activeFlights;
    }

    /**
     * @dev Get a user's bookings
     * @param _traveler Address of the traveler
     * @return Array of booking IDs
     */
    function getUserBookings(
        address _traveler
    ) external view returns (uint256[] memory) {
        uint256 bookingCount = 0;

        // Count user's bookings
        for (uint256 i = 1; i < bookingCounter; i++) {
            if (bookings[i].traveler == _traveler) {
                bookingCount++;
            }
        }

        // Create array of booking IDs
        uint256[] memory userBookings = new uint256[](bookingCount);
        uint256 index = 0;

        for (uint256 i = 1; i < bookingCounter; i++) {
            if (bookings[i].traveler == _traveler) {
                userBookings[index] = i;
                index++;
            }
        }

        return userBookings;
    }

    /**
     * @dev Withdraw ETH from the contract
     * @param _amount Amount to withdraw
     */
    function withdrawEth(uint256 _amount) external onlyOwner {
        require(_amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(_amount);
    }

    /**
     * @dev Withdraw ERC20 tokens from the contract
     * @param _tokenAddress Address of the ERC20 token
     * @param _amount Amount to withdraw
     */
    function withdrawTokens(
        address _tokenAddress,
        uint256 _amount
    ) external onlyOwner {
        IERC20 token = IERC20(_tokenAddress);
        require(
            _amount <= token.balanceOf(address(this)),
            "Insufficient token balance"
        );
        require(token.transfer(owner(), _amount), "Token transfer failed");
    }
}
