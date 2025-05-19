let pickupAutocomplete, dropoffAutocomplete;
let isPickupValid = false;
let isDropoffValid = false;
	
// Initialize Autocomplete
function initializeAutocomplete() {
    pickupAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('pickup-city'),
        { 	types: ['geocode'],
        	componentRestrictions: { country: 'us' } 
		} 
    );

    dropoffAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('dropoff-address'),
        { 	types: ['geocode'],
        	componentRestrictions: { country: 'us' } 
		}
    );

	// Listen for actual address selection
	pickupAutocomplete.addListener('place_changed', function () {
		const place = pickupAutocomplete.getPlace();
		isPickupValid = !!place.geometry;
	});

	dropoffAutocomplete.addListener('place_changed', function () {
		const place = dropoffAutocomplete.getPlace();
		isDropoffValid = !!place.geometry;
	});
	
	// Reset validity on user typing
	document.getElementById('pickup-city').addEventListener('input', () => {
		isPickupValid = false;
	});

	document.getElementById('dropoff-address').addEventListener('input', () => {
		isDropoffValid = false;
	});
}
	
// 	Show results
 document.addEventListener("DOMContentLoaded", () => {
    const price = localStorage.getItem('lastCalculatedPrice');	 
    let currentStep = 1;
	 
    if (price) {
      document.getElementById('local-price-summary').style.display = 'flex';
	  document.getElementById('calculator-heading').style.display = 'none';
	  document.getElementById('transport-form').style.display = 'none';
      document.getElementById('local-price-text').textContent = `$${parseFloat(price).toFixed(2)}`;
    } else {
		const steps = document.querySelectorAll('.form-step');

		const showStep = (step) => {
		  steps.forEach((el) => el.style.display = 'none');
		  const current = document.querySelector(`.form-step[data-step="${step}"]`);
		  if (current) current.style.display = 'flex';
		};

		// Next buttons
		document.querySelectorAll('.next-btn').forEach((btn) => {
			btn.addEventListener('click', () => {
				const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
				const inputs = currentStepEl.querySelectorAll('input, select, textarea');
				let isValid = true;

				inputs.forEach((input) => {
					if (input.hasAttribute('required') && !input.value.trim()) {
						input.classList.add('input-error');
						isValid = false;
					} else {
						input.classList.remove('input-error');
					}
				});

				if (!isValid) {
					alert('Please fill in all required fields before proceeding.');
					return;
				}
				
				// Step-specific validation
				if (currentStep === 2) {
					if (!isPickupValid || !isDropoffValid) {
						alert('Please select a valid pickup and dropoff address from the dropdown.');
						document.getElementById('pickup-city').classList.add('input-error');
						document.getElementById('dropoff-address').classList.add('input-error');
						return;
					}
				}

				currentStep++;
				showStep(currentStep);
			});
		});

		// Back buttons
		document.querySelectorAll('.back-btn').forEach(btn => {
		  btn.addEventListener('click', () => {
			currentStep--;
			showStep(currentStep);
		  });
		});

		showStep(currentStep); // Initialize view
 	}
  });

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

// Event listeners for pickup window and service selection
document.getElementById('pickup-window').addEventListener('change', updateDropoffWindow);
document.getElementById('services').addEventListener('change', updateDropoffWindow);

function updateDropoffWindow() {
    const pickupInput = document.getElementById('pickup-window').value;
    const service = document.getElementById('services').value;
    const dropoffDisplay = document.getElementById('dropoff-window-display'); // The <p> where we show the range

    if (!pickupInput || !service) {
        dropoffDisplay.textContent = "Select a pick-up date and service to see the pick-up window end.";
        return;
    }

    // Ensure pickupDate is in local time (prevents timezone issues)
    const pickupDate = new Date(pickupInput + "T00:00:00"); 
    pickupDate.setHours(0, 0, 0, 0); // Reset time to avoid timezone shifts

    let maxDays;

    // Set maximum days based on selected service
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
            maxDays = 0; // Same-day delivery (no extra days)
            break;
        default:
            maxDays = 4; // Default to shared-ride
    }

    // Create a NEW date object to avoid modifying pickupDate
    const dropoffDate = new Date(pickupDate.getTime());
    dropoffDate.setDate(dropoffDate.getDate() + maxDays - 1);
	
	// Mapping service slugs to readable names
    const serviceNames = {
        'shared-ride': 'Shared Ride',
        'semi-private-ride': 'Semi-Private Ride',
        'private-ride': 'Private Ride',
        'private-ride-two-drivers': 'Private Ride (Two Drivers)'
    };
	
	const formattedService = serviceNames[service] || service; // Default to raw name if not found

    // Display formatted range
    if (maxDays === 0) {
        dropoffDisplay.innerHTML = `Pick-up range: <strong>${formatDate(pickupDate)} (Same Day)</strong> <br> <p> Service:<strong> ${formattedService}</strong></p>`;
    } else {
        dropoffDisplay.innerHTML = `Pick-up window begin:<strong> ${formatDate(pickupDate)}</strong> <br> Pick-up window end: <strong>${formatDate(dropoffDate)}</strong> <br> <p>Service:<strong> ${formattedService} </strong></p>`;
    }
}

// Helper function to format date as "Month Day" (e.g., "March 16")
function formatDate(date) {
    const options = { month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

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

// Function to render pet fields based on the number of animals
function renderPetFields(numAnimals) {
    const dynamicPetsContainer = document.getElementById('dynamic-pets-container');
    dynamicPetsContainer.innerHTML = ''; // Clear existing fields

    for (let i = 1; i <= numAnimals; i++) {
        const petDiv = document.createElement('div');
        petDiv.classList.add('pet-fields');
        petDiv.innerHTML = `
            <h3>Pet #${i}</h3>
            <label for="pet-${i}-weight">Crate Size Needed:
				<select name="pet-${i}-crate-size-needed" id="pet-${i}-weight" required>
					<option value="select">Select</option>
					<option value="small">Small - Up to 19 inches</option>
					<option value="medium">Medium - Up to 24 inches</option>
					<option value="large">Large - Up to 28 inches</option>
					<option value="xl">XL - Up to 35 inches</option>
					<option value="xxl">XXL - Up to 40 inches</option>
				</select>
			</label>
            
            <label for="pet-${i}-type">Type of Pet:
				<select name="pet-${i}-type" id="pet-${i}-type" required>
					<option value="select">Select</option>
					<option value="dog">Dog</option>
					<option value="cat">Cat</option>
					<option value="other">Other</option>
				</select>   
			</label>
            
            <label for="pet-${i}-height">Estimated Height (in inches):
            	<input type="text" name="pet-${i}-height" id="pet-${i}-height" placeholder="Standing up from floor to head (inches)." required>
			</label>
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
                    <label for="shared-crate">Would these two share a crate?
						<select name="shared-crate" id="shared-crate" required>
							<option value="yes">Yes</option>
							<option value="no">No</option>
						</select>
					</label>
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

    checkSharedCrate();
}

// Event listener for the number of animals
document.getElementById('num-animals').addEventListener('change', () => {
    const numAnimals = parseInt(document.getElementById('num-animals').value, 10);
    renderPetFields(numAnimals);
});
	
// Function to disable past dates
function disablePastDates() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight to avoid issues

    // Format the date to YYYY-MM-DD (compatible with input[type="date"])
    const minDate = today.toISOString().split('T')[0];

    // Set the min attribute to prevent selecting past dates
    document.getElementById('pickup-window').setAttribute('min', minDate);
}

// Initial load: Render fields for one pet by default
window.onload = () => {
    disablePastDates();
    renderPetFields(1);
};
	
	let submitTimer = null;

function checkAllPetTypesSelected(numPets) {
	let allSelected = true;
	for (let i = 1; i <= numPets; i++) {
		const petType = document.getElementById(`pet-${i}-type`);
		if (!petType || !petType.value.trim()) {
			allSelected = false;
			break;
		}
	}
	return allSelected;
}

// function handlePetTypeSelection() {
// 	const numPets = parseInt(document.getElementById('num-animals').value);

// 	// Clear any existing timer
// 	if (submitTimer) {
// 		clearTimeout(submitTimer);
// 		submitTimer = null;
// 	}

// 	if (!checkAllPetTypesSelected(numPets)) {
// 		// Hide submit if incomplete
// 		document.getElementById('submit-btn').style.display = 'none';
// 		document.getElementById('submit-spinner').style.display = 'none';
// 		return;
// 	}

// 	// Show spinner while we "calculate"
// 	document.getElementById('submit-spinner').style.display = 'block';

// 	// Add a 2-second delay before showing submit
// 	submitTimer = setTimeout(() => {
// 		document.getElementById('submit-spinner').style.display = 'none';
// 		document.getElementById('submit-btn').style.display = 'inline-block';
// 	}, 2000);
// }


// Calculate results before submit button 
function validateFormBeforeCalculation(shouldTriggerCalculation = false) {
    const pickupDate = new Date(document.getElementById('pickup-window').value);
    const pickupAddress = document.getElementById('pickup-city').value;
    const dropoffAddress = document.getElementById('dropoff-address').value;
    const numAnimals = parseInt(document.getElementById('num-animals').value);
    const sharedCrateOption = document.getElementById('shared-crate');
    
    if (!pickupDate || !pickupAddress || !dropoffAddress || !numAnimals) {
        return { valid: false, message: "Please fill in all fields!" };
    }

    if (!isPickupValid || !isDropoffValid) {
        return { valid: false, message: "Please select a valid address from the dropdown suggestions." };
    }

    for (let i = 1; i <= numAnimals; i++) {
        const weight = document.getElementById(`pet-${i}-weight`).value;
        const type = document.getElementById(`pet-${i}-type`).value;
        if (!weight || weight === "select" || !type || type === "select") {
            return { valid: false, message: `Please select crate size and type for Pet #${i}` };
        }
    }

    // If both pets are small, shared crate must be selected
    if (numAnimals === 2) {
        const pet1 = document.getElementById('pet-1-weight').value.trim().toLowerCase();
        const pet2 = document.getElementById('pet-2-weight').value.trim().toLowerCase();
        if (pet1 === 'small' && pet2 === 'small') {
            if (!sharedCrateOption || sharedCrateOption.value === "") {
                return { valid: false, message: "Please specify if the two small pets will share a crate." };
            }
        }
    }

    if (shouldTriggerCalculation) {
        triggerCalculation((finalTotalPrice) => {
            localStorage.setItem('finalTotalPrice', finalTotalPrice);
        });
    }

    return { valid: true };
}

function triggerCalculation(onComplete) {
    const validation = validateFormBeforeCalculation();
    if (!validation.valid) {
        document.getElementById('error-thing').innerHTML = `<p style="color:red;">${validation.message}</p>`;
        return;
    }

    const service = document.getElementById('services').value;
    const pickupAddress = document.getElementById('pickup-city').value;
    const dropoffAddress = document.getElementById('dropoff-address').value;
    const numAnimals = parseInt(document.getElementById('num-animals').value);
    const sharedCrateOption = document.getElementById('shared-crate');

    const dogSizes = [];
    for (let i = 1; i <= numAnimals; i++) {
        const size = document.getElementById(`pet-${i}-weight`).value;
        dogSizes.push(size);
    }

    calculateDistance(pickupAddress, dropoffAddress, (distanceMiles, isFloridaTrip) => {
        if (distanceMiles === null) {
            document.getElementById('error-thing').innerHTML = `<p style="color:red;">Unable to calculate distance. Please check your addresses.</p>`;
            return;
        }

        let basePrice;
        if (distanceMiles < 500) {
            basePrice = isFloridaTrip ? 400 : 500;
        } else {
            const roundedDistance = Math.round(distanceMiles);
            const pricePerMile = getPricePerMile(roundedDistance, dogSizes, service);
            basePrice = roundedDistance * pricePerMile;
        }
		
		const sharedCrateValue = (numAnimals === 2 && sharedCrateOption && sharedCrateOption.style.display !== "none") ? sharedCrateOption.value || "No" : "No";

		const { totalPrice, breakdown } = calculateTotalPriceWithBreakdown(basePrice, numAnimals, sharedCrateValue);

        const deposit = depositCosts[service] || 0;
        const finalTotalPrice = totalPrice + deposit;
        const rushMessage = window.isRushJob ? "<p style='color: red; font-weight: bold;'>THIS IS A RUSHED JOB</p>" : "";

		// Save in localStorage
        localStorage.setItem('lastCalculatedPrice', finalTotalPrice);

        // Update hidden field if exists
        const hiddenField = document.getElementById('calculated-price');
        if (hiddenField) {
            hiddenField.value = finalTotalPrice.toFixed(2);
        }																   	
																		   
//         document.getElementById('price-output').innerHTML = `
//             <p>Distance: ${distanceMiles < 500 ? "Minimum Applied" : Math.round(distanceMiles) + " miles"}</p>
//             <p>Service: ${service}</p>
//             <p>Number of Animals: ${numAnimals}</p>
//             <p>${rushMessage}</p>
//             <p>Detailed Breakdown:</p>
//             <ul>
//                 ${breakdown.map((item) => `<li>${item}</li>`).join('')}
//             </ul>
//             <p>Deposit: $${deposit}</p>
//             <p>Total Price: $${finalTotalPrice.toFixed(2)}</p>
//         `;
    });
}

// When crate size or pet type is changed, auto-trigger the calculation
document.addEventListener('change', (event) => {
    const relevantSelectors = [
        'select[id^="pet-"][id$="-type"]',
        'select[id^="pet-"][id$="-weight"]',
        '#num-animals',
        '#shared-crate'
    ];

    if (relevantSelectors.some(sel => event.target.matches(sel))) {
        const result = validateFormBeforeCalculation(true);
        if (!result.valid) {
            console.log(result.message); // Optionally show the error somewhere
        }
    }
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

                // Check if the trip is within Florida
                checkIfTripIsInFlorida(pickupAddress, dropoffAddress, (isFloridaTrip) => {
                    callback(distanceMiles, isFloridaTrip);
                });
            } else {
                console.error("Error fetching Distance Matrix data:", status);
                callback(null);
            }
        }
    );
}

// Function to check if both addresses are in Florida
function checkIfTripIsInFlorida(pickupAddress, dropoffAddress, callback) {
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: pickupAddress }, (pickupResults, status) => {
        if (status !== "OK" || !pickupResults[0]) {
            callback(false);
            return;
        }

        geocoder.geocode({ address: dropoffAddress }, (dropoffResults, status) => {
            if (status !== "OK" || !dropoffResults[0]) {
                callback(false);
                return;
            }

            const pickupState = getStateFromAddressComponents(pickupResults[0].address_components);
            const dropoffState = getStateFromAddressComponents(dropoffResults[0].address_components);

            const isFloridaTrip = pickupState === "FL" && dropoffState === "FL";
            callback(isFloridaTrip);
        });
    });
}

// Extract the state abbreviation (e.g., "FL") from Google Maps address components
function getStateFromAddressComponents(components) {
    for (let component of components) {
        if (component.types.includes("administrative_area_level_1")) {
            return component.short_name; // Example: "FL" for Florida
        }
    }
    return null;
}

function highlightRushDates() {
    const dateInput = document.getElementById('pickup-window');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fourDaysLater = new Date(today);
    fourDaysLater.setDate(today.getDate() + 4);

    dateInput.addEventListener('input', function () {
        const selectedDate = new Date(this.value + "T00:00:00"); // Force local time format
        
        // Check if the selected date is within the rush job range
        window.isRushJob = selectedDate.getTime() >= today.getTime() && selectedDate.getTime() <= fourDaysLater.getTime();

        if (window.isRushJob) {
            this.classList.add('rush-job-highlight'); // Apply yellow background
        } else {
            this.classList.remove('rush-job-highlight'); // Remove yellow background
        }
    });
}

// Initialize rush highlighting
highlightRushDates();

function getPricePerMile(distance, dogSizes, service) {
    let totalRate = 0;

    // Shared Ride rates based on weight (dog size)
    const sharedRates = {
        small: [0.7, 0.65, 0.6, 0.56, 0.54, 0.54],
        medium: [0.72, 0.67, 0.62, 0.57, 0.55, 0.55],
        large: [0.74, 0.69, 0.64, 0.59, 0.56, 0.56],
        'x-large': [0.76, 0.7, 0.66, 0.63, 0.61, 0.61],
        'xx-large': [0.76, 0.7, 0.66, 0.63, 0.61, 0.61]
    };

    // Private ride rates
    const privateRates = [2.2, 1.5, 1.3, 1.27, 1.25, 1.13, 1.13];

    // Private ride (two drivers) rates
    const privateTwoDriverRates = [2.5, 1.7, 1.55, 1.4, 1.32, 1.27, 1.27];

    // Semi-private ride rates (25% of private ride rates)
    const semiPrivateRates = privateRates.map(rate => rate * 0.75);

    // Define distance ranges
    const distanceRanges = [1000, 1500, 2000, 2500, 2700, 3200];

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
        if (dogSize === 'x-large') {
            rate += 100 / distance;
        } else if (dogSize === 'xx-large') {
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
	
document.getElementById('reset').addEventListener('click', () => {
	localStorage.removeItem('lastCalculatedPrice');
	
	window.location.reload(true);

	// Hide price summary section
	document.getElementById('local-price-summary').style.setProperty('display', 'none');

	// Show the full form again
	document.getElementById('transport-form').style.setProperty('display', 'block');

	// Optionally reset form fields too
	document.getElementById('transport-form').reset();

	// Hide submit/spinner just in case
	document.getElementById('submit-btn').style.setProperty('display', 'none');
	document.getElementById('submit-spinner').style.setProperty('display', 'none');
});