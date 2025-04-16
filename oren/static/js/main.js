document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Get DOM elements
    const searchForm = document.getElementById('searchForm');
    const diseaseIndicationSelect = document.getElementById('diseaseIndication');
    const patientPopulationSelect = document.getElementById('patientPopulation');
    const clinicalPhenotypeSelect = document.getElementById('clinicalPhenotype');
    const targetingStrategySelect = document.getElementById('targetingStrategy');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsBody = document.getElementById('resultsBody');
    const explanationModal = new bootstrap.Modal(document.getElementById('explanationModal'));
    const explanationContent = document.getElementById('explanationContent');
    const explanationLoading = document.getElementById('explanationLoading');

    console.log('Form elements:', {
        searchForm: searchForm,
        diseaseIndicationSelect: diseaseIndicationSelect,
        patientPopulationSelect: patientPopulationSelect,
        clinicalPhenotypeSelect: clinicalPhenotypeSelect,
        targetingStrategySelect: targetingStrategySelect,
        loadingIndicator: loadingIndicator,
        resultsContainer: resultsContainer,
        resultsBody: resultsBody
    });

    // Disease options data
    const diseaseOptions = {
        breast_cancer: {
            populations: ['ER+', 'HER2+', 'Triple Negative'],
            phenotypes: ['Tumor Regression', 'Metastasis Prevention', 'Survival Improvement']
        },
        diabetes: {
            populations: ['Type 1', 'Type 2', 'Gestational'],
            phenotypes: ['Blood Glucose Control', 'Insulin Sensitivity', 'Beta Cell Preservation']
        },
        atherosclerosis: {
            populations: ['High Risk', 'Post-Event', 'Primary Prevention'],
            phenotypes: ['Plaque Regression', 'Inflammation Reduction', 'Lipid Control']
        },
        prostate_cancer: {
            populations: ['Localized', 'Metastatic', 'Castration Resistant'],
            phenotypes: ['PSA Reduction', 'Tumor Growth Inhibition', 'Survival Extension']
        }
    };

    // Update dropdowns based on selected disease
    diseaseIndicationSelect.addEventListener('change', function() {
        const selectedDisease = this.value;
        const options = diseaseOptions[selectedDisease] || { populations: [], phenotypes: [] };
        
        // Update patient population dropdown
        patientPopulationSelect.innerHTML = '<option value="">Select a patient population...</option>';
        options.populations.forEach(population => {
            const option = document.createElement('option');
            option.value = population.toLowerCase().replace(/\s+/g, '_');
            option.textContent = population;
            patientPopulationSelect.appendChild(option);
        });
        patientPopulationSelect.disabled = !selectedDisease;
        
        // Update clinical phenotype dropdown
        clinicalPhenotypeSelect.innerHTML = '<option value="">Select a clinical phenotype...</option>';
        options.phenotypes.forEach(phenotype => {
            const option = document.createElement('option');
            option.value = phenotype.toLowerCase().replace(/\s+/g, '_');
            option.textContent = phenotype;
            clinicalPhenotypeSelect.appendChild(option);
        });
        clinicalPhenotypeSelect.disabled = !selectedDisease;
    });

    // Handle form submission
    searchForm.addEventListener('submit', async function(e) {
        console.log('Form submitted');
        e.preventDefault();
        
        // Show loading indicator and hide results
        loadingIndicator.classList.remove('d-none');
        resultsContainer.classList.add('d-none');
        
        // Get form values - match the field names expected by the API
        const formData = {
            indication: diseaseIndicationSelect.value,
            patient_population: patientPopulationSelect.value,
            clinical_phenotype: clinicalPhenotypeSelect.value,
            targeting_strategy: targetingStrategySelect.value
        };
        
        console.log('Form data:', formData);
        
        try {
            console.log('Making API request...');
            // Make API call to get target pairs
            const response = await fetch('/api/rank_target_pairs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            console.log('API response:', response);
            
            if (!response.ok) {
                throw new Error('Failed to fetch results');
            }
            
            const data = await response.json();
            console.log('API data:', data);
            
            // Display results
            displayResults(data.target_pairs);
            resultsContainer.classList.remove('d-none');
            
        } catch (error) {
            console.error('Error:', error);
            resultsBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger">
                        An error occurred while fetching results. Please try again.
                    </td>
                </tr>
            `;
            resultsContainer.classList.remove('d-none');
        } finally {
            loadingIndicator.classList.add('d-none');
        }
    });

    // Function to display results
    function displayResults(targetPairs) {
        console.log('Displaying results:', targetPairs);
        resultsBody.innerHTML = '';
        
        if (targetPairs.length === 0) {
            resultsBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">No target pairs found</td>
                </tr>
            `;
        } else {
            targetPairs.forEach(pair => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${pair.target1} + ${pair.target2}</td>
                    <td class="${getScoreClass(pair.synergy_score)}">${pair.synergy_score}</td>
                    <td class="${getScoreClass(pair.toxicity_score)}">${pair.toxicity_score}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="showExplanation('${pair.target1}', '${pair.target2}', '${diseaseIndicationSelect.value}')">
                            Explain
                        </button>
                    </td>
                `;
                resultsBody.appendChild(row);
            });
        }
    }

    // Function to get score class
    function getScoreClass(score) {
        if (score >= 0.7) return 'score-high';
        if (score >= 0.4) return 'score-medium';
        return 'score-low';
    }

    // Function to show explanation
    window.showExplanation = async function(target1, target2, indication) {
        console.log('Showing explanation for:', { target1, target2, indication });
        explanationLoading.classList.remove('d-none');
        explanationContent.classList.add('d-none');
        explanationModal.show();
        
        try {
            const response = await fetch('/api/explain', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    target1: target1,
                    target2: target2,
                    indication: indication,
                    patient_population: patientPopulationSelect.value,
                    clinical_phenotype: clinicalPhenotypeSelect.value
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch explanation');
            }
            
            const data = await response.json();
            
            // Format the explanation text
            let formattedExplanation = data.explanation
                // Replace markdown-style headers with HTML headers
                .replace(/###\s*(.*?)(?:\n|$)/g, '<h3>$1</h3>')
                .replace(/\*\*\*(.*?)\*\*\*/g, '<h4>$1</h4>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                // Replace newlines with <br> tags
                .replace(/\n/g, '<br>');
            
            explanationContent.innerHTML = formattedExplanation;
            
        } catch (error) {
            console.error('Error:', error);
            explanationContent.innerHTML = 'Failed to generate explanation. Please try again.';
        } finally {
            explanationLoading.classList.add('d-none');
            explanationContent.classList.remove('d-none');
        }
    };

    // Add sorting functionality
    document.querySelectorAll('th[data-sort]').forEach(header => {
        header.addEventListener('click', function() {
            const sortBy = this.dataset.sort;
            const rows = Array.from(resultsBody.querySelectorAll('tr'));
            
            rows.sort((a, b) => {
                const aValue = parseFloat(a.children[sortBy === 'synergy' ? 1 : 2].textContent);
                const bValue = parseFloat(b.children[sortBy === 'synergy' ? 1 : 2].textContent);
                return bValue - aValue;
            });
            
            resultsBody.innerHTML = '';
            rows.forEach(row => resultsBody.appendChild(row));
        });
    });
}); 