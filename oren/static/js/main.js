document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const searchForm = document.getElementById('searchForm');
    const indicationSelect = document.getElementById('indication');
    const patientPopulationSelect = document.getElementById('patientPopulation');
    const clinicalPhenotypeSelect = document.getElementById('clinicalPhenotype');
    const strategySelect = document.getElementById('strategy');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsBody = document.getElementById('resultsBody');
    const noResultsMessage = document.getElementById('noResults');
    const explanationModal = new bootstrap.Modal(document.getElementById('explanationModal'));
    const explanationContent = document.getElementById('explanationContent');
    const explanationLoading = document.getElementById('explanationLoading');

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
    indicationSelect.addEventListener('change', function() {
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

    // Form submission handler
    searchForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Show loading indicator
        loadingIndicator.classList.remove('d-none');
        resultsContainer.classList.add('d-none');
        resultsBody.innerHTML = '';
        noResultsMessage.classList.add('d-none');

        // Get form values
        const formData = {
            disease_indication: indicationSelect.value,
            patient_population: patientPopulationSelect.value,
            clinical_phenotype: clinicalPhenotypeSelect.value,
            targeting_strategy: strategySelect.value
        };

        try {
            // Make API request
            const response = await fetch('/api/rank_target_pairs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            
            // Hide loading indicator
            loadingIndicator.classList.add('d-none');

            // Display results
            if (data.target_pairs && data.target_pairs.length > 0) {
                displayResults(data.target_pairs);
            } else {
                noResultsMessage.classList.remove('d-none');
            }
        } catch (error) {
            console.error('Error:', error);
            loadingIndicator.classList.add('d-none');
            noResultsMessage.classList.remove('d-none');
            noResultsMessage.innerHTML = '<p>An error occurred while fetching results. Please try again.</p>';
        }
    });

    // Display results in table
    function displayResults(targetPairs) {
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
                        <button class="btn btn-sm btn-outline-primary" onclick="showExplanation('${pair.target1}', '${pair.target2}', '${indicationSelect.value}')">
                            Explain
                        </button>
                    </td>
                `;
                resultsBody.appendChild(row);
            });
        }
        
        resultsContainer.classList.remove('d-none');
    }

    // Get CSS class based on score
    function getScoreClass(score) {
        if (score >= 0.7) return 'score-high';
        if (score >= 0.4) return 'score-medium';
        return 'score-low';
    }

    // Show explanation modal
    window.showExplanation = async function(target1, target2, indication) {
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
                    indication: indication
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            explanationContent.innerHTML = data.explanation.replace(/\n/g, '<br>');
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