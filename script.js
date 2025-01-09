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

const depositCosts = {
    'shared-ride': 300,
    'semi-private-ride': 450,
    'private-ride': 500,
    'private-ride-two-drivers': 700,
};

// Initialize today's date
const today = new Date();

document.getElementById('pickup-window').setAttribute('min', today.toISOString().split('T')[0]);

// Event listener for the pickup window
document.getElementById('pickup-window').addEventListener('change', () => {
    const pickupDate = new Date(document.getElementById('pickup-window').value);
    const service = document.getElementById('services').value; // Get selected service

    let maxDays;
    // Set maximum days based on the service
    switch (service) {
        case 'shared-ride':
            maxDays = 4;
            break;
        case 'semi-private-ride':
            maxDays = 3;
            break;
        case 'private-ride':
            maxDays = 2;
            break;
        case 'private-ride-two-drivers':
            maxDays = 1;
            break;
        default:
            maxDays = 4; // Default to shared-ride
    }

    // Calculate the maximum drop-off date
    const maxDropOffDate = new Date(pickupDate);
    maxDropOffDate.setDate(pickupDate.getDate() + maxDays);

    // Set the drop-off date limits dynamically
    document.getElementById('dropoff-window').setAttribute('min', pickupDate.toISOString().split('T')[0]);
    document.getElementById('dropoff-window').setAttribute('max', maxDropOffDate.toISOString().split('T')[0]);
});

document.getElementById('num-animals').addEventListener('change', () => {
    const numAnimals = parseInt(document.getElementById('num-animals').value, 10);
    const sharedRideOption = document.querySelector('#services option[value="shared-ride"]');

    // Disable "Shared Ride" if more than 4 animals are selected
    if (numAnimals > 4) {
        sharedRideOption.disabled = true;

        // If "Shared Ride" is currently selected, reset the selection
        const serviceSelect = document.getElementById('services');
        if (serviceSelect.value === 'shared-ride') {
            serviceSelect.value = 'semi-private-ride'; // Reset to no selection or another valid option
        }
    } else {
        sharedRideOption.disabled = false; // Enable "Shared Ride" if 4 or fewer animals are selected
    }
});


// Show crate selection for 2 pets
// document.getElementById('num-animals').addEventListener('change', (event) => {
//     const numAnimals = parseInt(event.target.value, 10);
//     const crateSelection = document.getElementById('crate-selection');

//     if (numAnimals === 2) {
//         crateSelection.style.display = 'block';
//     } else {
//         crateSelection.style.display = 'none';
//     }
// });

// Function to render pet fields based on the number of animals
function renderPetFields(numAnimals) {
    const dynamicPetsContainer = document.getElementById('dynamic-pets-container');
    dynamicPetsContainer.innerHTML = ''; // Clear existing fields

    for (let i = 1; i <= numAnimals; i++) {
        const petDiv = document.createElement('div');
        petDiv.classList.add('pet-fields');
        petDiv.innerHTML = `
            <h3>Pet #${i}</h3>
            <label for="pet-${i}-weight">Weight:</label>
            <select id="pet-${i}-weight" required>
                <option value="small">Small: 1-29 lbs</option>
                <option value="medium">Medium: 30-44 lbs</option>
                <option value="large">Large: 45-74 lbs</option>
                <option value="x-large">X-Large: 75-99 lbs</option>
                <option value="xx-large">XX-Large: 100-149 lbs</option>
                <option value="xxx-large">XXX-Large: 150-199 lbs</option>
            </select>
            
            <label for="pet-${i}-breed">Breed:</label>
            <input type="text" id="pet-${i}-breed" placeholder="Enter breed" required>
            
            <label for="pet-${i}-type">Type of Pet:</label>
            <select id="pet-${i}-type" required>
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="other">Other</option>
            </select>   
            
            <label for="pet-${i}-crate">Crate Size Needed:</label>
            <select id="pet-${i}-crate" required>
                <option value="small">Small - Up to 19"</option>
                <option value="medium">Medium - Up to 24"</option>
                <option value="large">Large - Up to 28"</option>
                <option value="xl">XL - Up to 35"</option>
                <option value="xxl">XXL - Up to 40"</option>
            </select>
        `;

        dynamicPetsContainer.appendChild(petDiv);
    }

    // Add the shared crate option if there are exactly 2 small pets
    if (numAnimals === 2) {
        addSharedCrateLogic();
    }
}

function addSharedCrateLogic() {
    const pet1WeightSelect = document.getElementById('pet-1-weight');
    const pet2WeightSelect = document.getElementById('pet-2-weight');

    const checkSharedCrate = () => {
        const pet1Weight = pet1WeightSelect.value;
        const pet2Weight = pet2WeightSelect.value;

        const sharedCrateOption = document.getElementById('shared-crate-option');
        if (pet1Weight === 'small' && pet2Weight === 'small') {
            if (!sharedCrateOption) {
                const sharedCrateDiv = document.createElement('div');
                sharedCrateDiv.id = 'shared-crate-option';
                sharedCrateDiv.innerHTML = `
                    <label for="shared-crate">Would these two share a crate?</label>
                    <select id="shared-crate" required>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                    </select>
                `;
                document.getElementById('dynamic-pets-container').appendChild(sharedCrateDiv);
            }
        } else if (sharedCrateOption) {
            sharedCrateOption.remove();
        }
    };

    // Attach event listeners to dropdowns
    pet1WeightSelect.addEventListener('change', checkSharedCrate);
    pet2WeightSelect.addEventListener('change', checkSharedCrate);
}

// Event listener for the number of animals
document.getElementById('num-animals').addEventListener('change', () => {
    const numAnimals = parseInt(document.getElementById('num-animals').value, 10);
    renderPetFields(numAnimals);
});

// Initial load: Render fields for one pet by default
window.onload = () => {
    renderPetFields(1);
};

// Validation before calculating the price
document.getElementById('calculate-btn').addEventListener('click', () => {
    const pickupDate = new Date(document.getElementById('pickup-window').value);
    const dropoffDate = new Date(document.getElementById('dropoff-window').value);

    if (!pickupDate || !dropoffDate) {
        alert("Please select both pickup and drop-off dates!");
        return;
    }

    const dateDifference = (dropoffDate - pickupDate) / (1000 * 60 * 60 * 24); // Convert milliseconds to days
    if (dateDifference < 0 || dateDifference > 4) {
        alert("The drop-off date must be within 4 days of the pickup date.");
        return;
    }

    const service = document.getElementById('services').value;
    const pickupAddress = document.getElementById('pickup-address').value;
    const dropoffAddress = document.getElementById('dropoff-address').value;
    const numAnimals = document.getElementById('num-animals').value;
    const sharedCrateOption = document.getElementById('shared-crate'); // New crate-sharing option

    if (!pickupAddress || !dropoffAddress || !numAnimals) {
        alert("Please fill in all fields!");
        return;
    }

    // Dynamically fetch all dog sizes
    const dogSizes = [];
    for (let i = 1; i <= numAnimals; i++) {
        const sizeElement = document.getElementById(`pet-${i}-weight`);
        if (sizeElement) {
            dogSizes.push(sizeElement.value);
        } else {
            alert(`Please select a size for Pet #${i}`);
            return;
        }
    }

    if (sharedCrateOption && !sharedCrateOption.value) {
        alert("Please specify if the two small pets will share a crate.");
        return;
    }

    calculateDistance(pickupAddress, dropoffAddress, (distanceMiles) => {
        if (distanceMiles === null) {
            alert("Unable to calculate distance. Please check your addresses.");
            return;
        }

        if (distanceMiles < 500) {
            distanceMiles = 500;
        }

        const roundedDistance = Math.round(distanceMiles);
        const pricePerMile = getPricePerMile(roundedDistance, dogSizes, service);
        const basePrice = roundedDistance * pricePerMile;

        const { totalPrice, breakdown } = calculateTotalPriceWithBreakdown(basePrice, numAnimals, sharedCrateOption ? sharedCrateOption.value : null);

        // Add deposit cost to total price
        const deposit = depositCosts[service] || 0; // Get deposit cost for the selected service
        const finalTotalPrice = totalPrice + deposit;

        document.getElementById('price-output').innerHTML = `
            <p>Distance: ${roundedDistance} miles</p>
            <p>Service: ${service}</p>
            <p>Number of Animals: ${numAnimals}</p>
            <p>Detailed Breakdown:</p>
            <ul>
                ${breakdown.map((item) => `<li>${item}</li>`).join('')}
            </ul>
            <p>Deposit: ${deposit}</p>
            <p>Total Price: $${finalTotalPrice.toFixed(2)}</p>
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
// function getPricePerMile(distance, dogSize, service) {
//     let rate;

//     // Shared Ride rates based on weight (dog size)
//     // Array [< 1000, >= 1000 && < 1500, >= 1500 && < 2000, >= 2000 && < 2500, >= 2500]
//     const sharedRates = {
//         small: [0.7, 0.65, 0.6, 0.56, 0.54],
//         medium: [0.72, 0.67, 0.62, 0.57, 0.55],
//         large: [0.74, 0.69, 0.64, 0.59, 0.56],
//         'x-large': [0.76, 0.7, 0.66, 0.63, 0.61],
//         'xx-large': [0.76, 0.7, 0.66, 0.63, 0.61],
//         'xxx-large': [0.76, 0.7, 0.66, 0.63, 0.61],
//     };

//     // Private ride rates
//     const privateRates = [2.2, 1.5, 1.3, 1.27, 1.25, 1.13];

//     // Private ride (two drivers) rates
//     const privateTwoDriverRates = [2.5, 1.7, 1.55, 1.4, 1.32, 1.27];

//     // Semi-private ride rates (25% of private ride rates)
//     const semiPrivateRates = privateRates.map(rate => rate * 0.25);

//     // Define distance ranges
//     const distanceRanges = [1000, 1500, 2000, 2500, 2800];

//     // Select appropriate rate set based on the service
//     let selectedRates;
//     switch (service) {
//         case 'shared-ride':
//             selectedRates = sharedRates[dogSize] || [];
//             break;
//         case 'private-ride':
//             selectedRates = privateRates;
//             break;
//         case 'private-ride-two-drivers':
//             selectedRates = privateTwoDriverRates;
//             break;
//         case 'semi-private-ride':
//             selectedRates = semiPrivateRates;
//             break;
//         default:
//             return 0; // Return 0 for unsupported services
//     }

//     // Determine the rate based on distance
//     for (let i = 0; i < distanceRanges.length; i++) {
//         if (distance < distanceRanges[i]) {
//             rate = selectedRates[i];
//             break;
//         }
//     }


//     if (dogSize === 'xxl') {
//         rate += 100 / distance;
//     } else if (dogSize === 'xxxl') {
//         rate += 150 / distance;
//     }


//     return rate || 0; // Return 0 if no rate found
// }

function getPricePerMile(distance, dogSizes, service) {
    let totalRate = 0;

    // Shared Ride rates based on weight (dog size)
    const sharedRates = {
        small: [0.7, 0.65, 0.6, 0.56, 0.54],
        medium: [0.72, 0.67, 0.62, 0.57, 0.55],
        large: [0.74, 0.69, 0.64, 0.59, 0.56],
        'x-large': [0.76, 0.7, 0.66, 0.63, 0.61],
        'xx-large': [0.76, 0.7, 0.66, 0.63, 0.61],
        'xxx-large': [0.76, 0.7, 0.66, 0.63, 0.61],
    };

    // Private ride rates
    const privateRates = [2.2, 1.5, 1.3, 1.27, 1.25, 1.13];

    // Private ride (two drivers) rates
    const privateTwoDriverRates = [2.5, 1.7, 1.55, 1.4, 1.32, 1.27];

    // Semi-private ride rates (25% of private ride rates)
    const semiPrivateRates = privateRates.map(rate => rate * 0.75);

    // Define distance ranges
    const distanceRanges = [1000, 1500, 2000, 2500, 2800];

    // Loop through each dog size to calculate its rate
    dogSizes.forEach(dogSize => {
        let rate = 0;

        // Select appropriate rate set based on the service
        let selectedRates;
        switch (service) {
            case 'shared-ride':
                selectedRates = sharedRates[dogSize] || [];
                break;
            case 'private-ride':
                selectedRates = privateRates;
                break;
            case 'private-ride-two-drivers':
                selectedRates = privateTwoDriverRates;
                break;
            case 'semi-private-ride':
                selectedRates = semiPrivateRates;
                break;
            default:
                return; // Skip unsupported services
        }

        // Determine the rate based on distance
        for (let i = 0; i < distanceRanges.length; i++) {
            if (distance < distanceRanges[i]) {
                rate = selectedRates[i];
                break;
            }
        }

        // Adjust rates for XXL and XXXL sizes
        if (dogSize === 'xx-large') {
            rate += 100 / distance;
        } else if (dogSize === 'xxx-large') {
            rate += 150 / distance;
        }

        // Add the rate for this pet to the total rate
        totalRate += rate;
    });

    // Return the average rate per mile across all pets
    return totalRate / dogSizes.length || 0; // Avoid division by zero
}

// Calculate total price with breakdown
function calculateTotalPriceWithBreakdown(basePrice, numAnimals, sharedCrate) {
    numAnimals = parseInt(numAnimals, 10);

    let totalPrice = 0;
    const breakdown = [];

    if (numAnimals === 1) {
        totalPrice = basePrice;
        breakdown.push(`First pet: $${basePrice.toFixed(2)}`);
    } else if (numAnimals === 2) {
        if (sharedCrate === 'yes') {
            const secondPetPrice = basePrice * 0.15; // 85% discount
            totalPrice = basePrice + secondPetPrice;
            breakdown.push(`First crate: $${basePrice.toFixed(2)}`);
            breakdown.push(`Second pet sharing the crate (85% off): $${secondPetPrice.toFixed(2)}`);
        } else {
            // Separate crate pricing
            const secondPetPrice = basePrice * 0.35; // 65% off for two separate crates
            totalPrice = basePrice + secondPetPrice;
            breakdown.push(`First pet: $${basePrice.toFixed(2)}`);
            breakdown.push(`Second pet (65% off): $${secondPetPrice.toFixed(2)}`);
        }
    } else {
        // Multi-pet scenario (additional pets)
        const secondPetPrice = basePrice * (sharedCrate === 'yes' ? 0.15 : 0.35); // Handle second pet discount
        totalPrice = basePrice + secondPetPrice;
        breakdown.push(`First pet: $${basePrice.toFixed(2)}`);
        if (sharedCrate !== 'yes') {
            breakdown.push(`Second pet (65% off): $${secondPetPrice.toFixed(2)}`);
        }

        // Additional pets (20% off each)
        for (let i = 3; i <= numAnimals; i++) {
            const additionalPetPrice = basePrice * 0.80; // 20% off
            totalPrice += additionalPetPrice;
            breakdown.push(`Pet ${i} (20% off): $${additionalPetPrice.toFixed(2)}`);
        }
    }

    return { totalPrice, breakdown };
}