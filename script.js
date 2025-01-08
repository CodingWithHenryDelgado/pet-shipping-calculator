let pickupAutocomplete, dropoffAutocomplete;

// Initialize Autocomplete
function initializeAutocomplete() {
    pickupAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('pickup-address'),
        { types: ['geocode'] } // Limit results to addresses
    );

    dropoffAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('dropoff-address'),
        { types: ['geocode'] }
    );
}

// Initialize the autocomplete on page load
window.onload = initializeAutocomplete;

// Initialize today's date
const today = new Date();

document.getElementById('pickup-window').setAttribute('min', today.toISOString().split('T')[0]);

// Event listener for the pickup window
document.getElementById('pickup-window').addEventListener('change', () => {
    const pickupDate = new Date(document.getElementById('pickup-window').value);

    // Calculate the maximum drop-off date (20 days after the pickup date)
    const maxDropOffDate = new Date(pickupDate);
    maxDropOffDate.setDate(pickupDate.getDate() + 20);

    // Set the drop-off date limits dynamically
    document.getElementById('dropoff-window').setAttribute('min', pickupDate.toISOString().split('T')[0]);
    document.getElementById('dropoff-window').setAttribute('max', maxDropOffDate.toISOString().split('T')[0]);
});

// Show crate selection for 2 pets
document.getElementById('num-animals').addEventListener('change', (event) => {
    const numAnimals = parseInt(event.target.value, 10);
    const crateSelection = document.getElementById('crate-selection');

    if (numAnimals === 2) {
        crateSelection.style.display = 'block';
    } else {
        crateSelection.style.display = 'none';
    }
});

// Validation before calculating the price
document.getElementById('calculate-btn').addEventListener('click', () => {
    const pickupDate = new Date(document.getElementById('pickup-window').value);
    const dropoffDate = new Date(document.getElementById('dropoff-window').value);

    if (!pickupDate || !dropoffDate) {
        alert("Please select both pickup and drop-off dates!");
        return;
    }

    const dateDifference = (dropoffDate - pickupDate) / (1000 * 60 * 60 * 24); // Convert milliseconds to days
    if (dateDifference < 0 || dateDifference > 20) {
        alert("The drop-off date must be within 20 days of the pickup date.");
        return;
    }

    const pickupAddress = document.getElementById('pickup-address').value;
    const dropoffAddress = document.getElementById('dropoff-address').value;
    const dogSize = document.getElementById('dog-size').value;
    const numAnimals = document.getElementById('num-animals').value;
    const petType = document.getElementById('pet-type').value;
    const breeds = document.getElementById('breeds').value;
    const crateCount = document.getElementById('crate-count').value;

    if (!pickupAddress || !dropoffAddress || !dogSize || !numAnimals || !petType || !breeds) {
        alert("Please fill in all fields!");
        return;
    }

    calculateDistance(pickupAddress, dropoffAddress, (distanceMiles) => {
        if (distanceMiles === null) {
            alert("Unable to calculate distance. Please check your addresses.");
            return;
        }

        const roundedDistance = Math.round(distanceMiles); // Round the distance
        const pricePerMile = getPricePerMile(roundedDistance, dogSize);
        const basePrice = roundedDistance * pricePerMile;

        // Calculate the total price with detailed breakdown
        const { totalPrice, breakdown } = calculateTotalPriceWithBreakdown(basePrice, numAnimals, crateCount);

        // Display the results
        document.getElementById('price-output').innerHTML = `
            <p>Distance: ${roundedDistance} miles</p>
            <p>Number of Animals: ${numAnimals}</p>
            <p>Type of Pet: ${petType}</p>
            <p>Breeds: ${breeds}</p>
            <p>Detailed Breakdown:</p>
            <ul>
                ${breakdown.map((item) => `<li>${item}</li>`).join('')}
            </ul>
            <p>Total Price: $${totalPrice.toFixed(2)}</p>
        `;
    });
});

// Use Google Maps DistanceMatrixService for distance calculation
function calculateDistance(pickupAddress, dropoffAddress, callback) {
    const service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
        {
            origins: [pickupAddress],
            destinations: [dropoffAddress],
            travelMode: google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
            if (status === google.maps.DistanceMatrixStatus.OK) {
                const distanceMiles =
                    response.rows[0].elements[0].distance.value / 1609.34; // Convert meters to miles
                callback(distanceMiles);
            } else {
                console.error("Error fetching Distance Matrix data:", status);
                callback(null);
            }
        }
    );
}

// Get pricing per mile based on distance range and dog size
function getPricePerMile(distance, dogSize) {
    let rate;

    if (distance < 1000) {
        rate = { small: 0.7, medium: 0.72, large: 0.74, 'x-large': 0.76 };
    } else if (distance >= 1000 && distance < 1500) {
        rate = { small: 0.65, medium: 0.67, large: 0.69, 'x-large': 0.7 };
    } else if (distance >= 1500 && distance < 2000) {
        rate = { small: 0.6, medium: 0.62, large: 0.64, 'x-large': 0.66 };
    } else if (distance >= 2000 && distance < 2500) {
        rate = { small: 0.56, medium: 0.57, large: 0.59, 'x-large': 0.63 };
    } else if (distance >= 2500) {
        rate = { small: 0.54, medium: 0.55, large: 0.56, 'x-large': 0.61 };
    } else {
        alert("Distance must be at least 500 miles.");
        return 0;
    }

    return rate[dogSize];
}

// Calculate total price based on the number of animals, crates, and discounts
// function calculateTotalPrice(basePrice, numAnimals, crateCount) {
//     numAnimals = parseInt(numAnimals, 10);

//     if (numAnimals === 1) {
//         return basePrice; // No additional pets, base price
//     } else if (numAnimals === 2) {
//         if (crateCount === '1') {
//             return basePrice + basePrice * 0.15; // Second pet 85% off in one crate
//         } else {
//             return basePrice + basePrice * 0.35; // Second pet 65% off in two crates
//         }
//     } else if (numAnimals === 3) {
//         // Second pet discount depends on crates; third pet 20% off
//         let secondPetDiscount = crateCount === '1' ? 0.15 : 0.35;
//         return basePrice + basePrice * secondPetDiscount + basePrice * 0.20;
//     } else {
//         // First crate at base price, second pet discount depends on crates, additional pets 20% off
//         let secondPetDiscount = crateCount === '1' ? 0.15 : 0.35;
//         let totalPrice = basePrice; // First pet full price
//         totalPrice += basePrice * secondPetDiscount; // Second pet
//         totalPrice += basePrice * 0.20 * (numAnimals - 2); // Remaining pets 20% off each
//         return totalPrice;
//     }
// }

// Calculate total price with breakdown
function calculateTotalPriceWithBreakdown(basePrice, numAnimals, crateCount) {
    numAnimals = parseInt(numAnimals, 10);

    let totalPrice = 0;
    const breakdown = [];

    if (numAnimals === 1) {
        totalPrice = basePrice;
        breakdown.push(`First pet: $${basePrice.toFixed(2)}`);
    } else if (numAnimals === 2) {
        // Determine the second pet's discount based on the crate count
        const secondPetPrice =
            crateCount === '1' ? basePrice * 0.15 : basePrice * 0.35; // 85% off for one crate, 65% off for two crates
        totalPrice = basePrice + secondPetPrice;
        breakdown.push(`First pet: $${basePrice.toFixed(2)}`);
        breakdown.push(
            `Second pet (${crateCount === '1' ? '85% off, one crate' : '65% off, two crates'}): $${secondPetPrice.toFixed(2)}`
        );
    } else {
        // Second pet
        const secondPetDiscount = crateCount === '1' ? 0.15 : 0.35;
        const secondPetPrice = basePrice * secondPetDiscount;
        totalPrice = basePrice + secondPetPrice;
        breakdown.push(`First pet: $${basePrice.toFixed(2)}`);
        breakdown.push(
            `Second pet (${secondPetDiscount === 0.15 ? '85% off, one crate' : '65% off, two crates'}): $${secondPetPrice.toFixed(2)}`
        );

        // Additional pets (20% off each)
        for (let i = 3; i <= numAnimals; i++) {
            const additionalPetPrice = basePrice * 0.80; // 20% off
            totalPrice += additionalPetPrice;
            breakdown.push(`Pet ${i} (20% off): $${additionalPetPrice.toFixed(2)}`);
        }
    }

    return { totalPrice, breakdown };
}