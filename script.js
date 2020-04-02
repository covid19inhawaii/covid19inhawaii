document.addEventListener('DOMContentLoaded', function() {
	// function to add commas to numbers
	function numberWithCommas(x) {
	    x = x.toString();
	    var pattern = /(-?\d+)(\d{3})/;
	    while (pattern.test(x))
	        x = x.replace(pattern, "$1,$2");
	    return x;
	}

	// function to get ordinal number
	var getGetOrdinal = function(n) {
	   var s=["th","st","nd","rd"],
	       v=n%100;
	   return n+(s[(v-20)%10]||s[v]||s[0]);
	}

	// if GET param -> state is used (e.g.: ?state=New York)
	// ------------------------------------------------------------------------------------------------------------------------
	var state = 'Hawaii';
	var stateChange = new URLSearchParams(window.location.search).get('state');

	if(stateChange) {
		state = stateChange;

		if(state !== 'Hawaii') {
			var hawaiiSpecificInfo = document.querySelector('#hawaiiSpecificInfo');
			hawaiiSpecificInfo.parentNode.removeChild(hawaiiSpecificInfo);

			var hiDeptHealth = document.querySelector('#hiDeptHealth');
			hiDeptHealth.parentNode.removeChild(hiDeptHealth);
		}
	}

	document.getElementById('stateName').innerHTML = state;
	// ------------------------------------------------------------------------------------------------------------------------

	// build cases and deaths chart for state and totals
	// ------------------------------------------------------------------------------------------------------------------------
	var getStates = new XMLHttpRequest();

	getStates.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			var states = Papa.parse(this.responseText);

			// chart data
			var hawaii = {
				labels: [],
				datasets: [
					{
						label: 'Cases',
						data: [],
						borderColor: 'rgba(217, 136, 128,1)',
						backgroundColor: 'rgba(217, 136, 128,0.2)'
					},
					{
						label: 'Deaths',
						data: [],						
						borderColor: 'rgba(240, 178, 122,1)',
						backgroundColor: 'rgba(240, 178, 122,0.2)'
					}
				]
			}

			var allStates = {};

			// days since
			var day = {
				cases: {
					beginDate: null,
					days: null
				},
				deaths: {
					beginDate: null,
					days: null
				}
			}

			states.data.forEach(function(value) {
				if(value[1] === state) {
					if(!hawaii.labels.includes(value[0])) {
						hawaii.labels.push(value[0])
					}

					hawaii.datasets[0].data.push({x: value[0], y: value[3]});    
					hawaii.datasets[1].data.push({x: value[0], y: value[4]});

					if(!day.cases.beginDate) {
						if(value[3] >= 1) {
							day.cases.beginDate = value[0];
						}
					}

					if(!day.deaths.beginDate) {
						if(value[4] >= 1) {
							day.deaths.beginDate = value[0];
						}
					}
				}

				allStates[value[1]] = {state: value[1], cases: parseInt(value[3]), deaths: parseInt(value[4])};
			});

			//ranking
			var stateCasesSort = Object.values(allStates);

			stateCasesSort.sort(function(a, b){
    			return b.cases-a.cases
			});

			stateCasesSort.shift();

			var stateDeathsSort = Object.values(allStates);

			stateDeathsSort.sort(function(a, b){
    			return b.deaths-a.deaths
			});

			stateDeathsSort.shift();

			var ranking = {
				cases: {
					rank: null,
					total: stateCasesSort.length
				},
				deaths: {
					rank: null,
					total: stateCasesSort.length
				}
			}

			stateCasesSort.forEach(function(value, index) {
				if(value.state === state) {
					ranking.cases.rank = index + 1;
				}
			});

			stateDeathsSort.forEach(function(value, index) {
				if(value.state === state) {
					ranking.deaths.rank = index + 1;
				}
			});

			document.getElementById('caseRanking').innerHTML = state + ' is ranked ' + getGetOrdinal(ranking.cases.rank) + ' out of ' + ranking.cases.total + ' states & territories.';
			document.getElementById('deathRanking').innerHTML = state + ' is ranked ' + getGetOrdinal(ranking.deaths.rank) + ' out of ' + ranking.cases.total + ' states & territories.';

			// begin date
			if(!day.cases.beginDate) {
				day.cases.beginDate = new Date();
			}

			if(!day.deaths.beginDate) {
				day.deaths.beginDate = new Date();
			}

			var now = moment(new Date());
			day.cases.days = now.diff(day.cases.beginDate, 'days');
			day.deaths.days = now.diff(day.deaths.beginDate, 'days');

			var caseDaysElem = document.getElementById('caseDays')
			caseDaysElem.innerHTML = day.cases.days + ' ' + (day.cases.days === 1 ? 'day' : 'days') + ' since the first case was reported.';

			var deathDaysElem = document.getElementById('deathDays')
			deathDaysElem.innerHTML = day.deaths.days + ' ' + (day.deaths.days === 1 ? 'day' : 'days') + ' since the first death was reported.';

			// totals
			var caseDiffFromPrevDay = hawaii.datasets[0].data[hawaii.datasets[0].data.length - 1].y - hawaii.datasets[0].data[hawaii.datasets[0].data.length - 2].y;
			var caseDiffFromPrevDayElem = document.getElementById('caseDiffFromPrevDay');
			caseDiffFromPrevDayElem.innerHTML = '(' + (caseDiffFromPrevDay > 0 ? '^' : '') + numberWithCommas(caseDiffFromPrevDay) + ')';

			if(caseDiffFromPrevDay <= 0) {
				caseDiffFromPrevDayElem.classList.add('less');
			}
			else {
				caseDiffFromPrevDayElem.classList.add('more');
			}

			var caseCountUp = new CountUp('cases', 0, hawaii.datasets[0].data[hawaii.datasets[0].data.length - 1].y);
			caseCountUp.start(function() {
				caseDiffFromPrevDayElem.classList.add('show');
				caseDaysElem.classList.add('show');
				document.getElementById('caseRanking').classList.add('show');
			});

			var deathDiffFromPrevDay = hawaii.datasets[1].data[hawaii.datasets[1].data.length - 1].y - hawaii.datasets[1].data[hawaii.datasets[1].data.length - 2].y;
			var deathDiffFromPrevDayElem = document.getElementById('deathDiffFromPrevDay');
			deathDiffFromPrevDayElem.innerHTML = '(' + (deathDiffFromPrevDay > 0 ? '^' : '') + numberWithCommas(deathDiffFromPrevDay) + ')';

			if(deathDiffFromPrevDay <= 0) {
				deathDiffFromPrevDayElem.classList.add('less');
			}
			else {
				deathDiffFromPrevDayElem.classList.add('more');
			}

			var deathCountUp = new CountUp('deaths', 0, hawaii.datasets[1].data[hawaii.datasets[1].data.length - 1].y);
			deathCountUp.start(function() {
				deathDiffFromPrevDayElem.classList.add('show');
				deathDaysElem.classList.add('show');
				document.getElementById('deathRanking').classList.add('show');
			});

			// chart
			var stateChartContainer = document.getElementById('state');

			var stateChart = new Chart(stateChartContainer, {
    			type: 'line',
    			data: hawaii,
   				options: {
   					title: {
   						display: true,
   						fontColor: '#FFF',
   						fontSize: 20,
	   					text: 'Cases and Deaths - State of ' + state
	   				},
	   				legend: {
	   					labels: {
	   						fontColor: '#fff',
	   						fontStyle: 'bold'
	   					}
	   				},
	   				scales: {
	   					yAxes: [
	   						{
	   							gridLines: {
	   								color: 'rgba(255,255,255,0.3)'
	   							},
	   							ticks: {
	   								color: 'rgba(255,255,255,0.3)',
	   								fontColor: '#fff'
	   							}
	   						}
	   					],
	   					xAxes: [
	   						{
	   							gridLines: {
	   								color: 'rgba(255,255,255,0.3)'
	   							},
	   							ticks: {
	   								color: 'rgba(255,255,255,0.3)',
	   								fontColor: '#fff'
	   							}
	   						}
	   					]
	   				}
   				}
			});

			var stateUpdated = states.data[states.data.length - 1][0];
			document.getElementById('stateUpdate').innerHTML = 'Updated ' + stateUpdated;
		}
	};

	getStates.open('GET', 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv', true);
	getStates.send();
	// ------------------------------------------------------------------------------------------------------------------------

	// build county charts
	// ------------------------------------------------------------------------------------------------------------------------
	if(state === 'Hawaii') {
		var getCounties = new XMLHttpRequest();

		getCounties.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				var counties = Papa.parse(this.responseText);

				// chart data
				var countyData = {
					cases: {
						labels: [],
						datasets: [
							{
								label: 'Hawaii',
								data: [],
								borderColor: 'rgba(217, 136, 128,1)',
								backgroundColor: 'rgba(217, 136, 128,0.2)'
							},
							{
								label: 'Honolulu',
								data: [],
								borderColor: 'rgba(247, 220, 111,1)',
								backgroundColor: 'rgba(247, 220, 111,0.2)'
							},
							{
								label: 'Kauai',
								data: [],
								borderColor: 'rgba(187, 143, 206,1)',
								backgroundColor: 'rgba(187, 143, 206,0.2)'
							},
							{
								label: 'Maui',
								data: [],
								borderColor: 'rgba(125, 206, 160,1)',
								backgroundColor: 'rgba(125, 206, 160,0.2)'
							}
						]
					},
					deaths: {
						labels: [],
						datasets: [
							{
								label: 'Hawaii',
								data: [],
								borderColor: 'rgba(217, 136, 128,1)',
								backgroundColor: 'rgba(217, 136, 128,0.2)'
							},
							{
								label: 'Honolulu',
								data: [],
								borderColor: 'rgba(247, 220, 111,1)',
								backgroundColor: 'rgba(247, 220, 111,0.2)'
							},
							{
								label: 'Kauai',
								data: [],
								borderColor: 'rgba(187, 143, 206,1)',
								backgroundColor: 'rgba(187, 143, 206,0.2)'
							},
							{
								label: 'Maui',
								data: [],
								borderColor: 'rgba(125, 206, 160,1)',
								backgroundColor: 'rgba(125, 206, 160,0.2)'
							}
						]
					}
				}

				counties.data.forEach(function(value) {
					if(value[1] === 'Hawaii' || value[1] === 'Honolulu' || value[1] === 'Kauai' || value[1] === 'Maui') {	
						if(!countyData.cases.labels.includes(value[0])) {
							countyData.cases.labels.push(value[0])
						}

						if(!countyData.cases.labels.includes(value[0])) {
							countyData.cases.labels.push(value[0])
						}

						if(!countyData.deaths.labels.includes(value[0])) {
							countyData.deaths.labels.push(value[0])
						}

						if(!countyData.deaths.labels.includes(value[0])) {
							countyData.deaths.labels.push(value[0])
						}

						if(value[1] === 'Hawaii') {
							countyData.cases.datasets[0].data.push({x: value[0], y: value[4]});
							countyData.deaths.datasets[0].data.push({x: value[0], y: value[5]});
						}

						if(value[1] === 'Honolulu') {
							countyData.cases.datasets[1].data.push({x: value[0], y: value[4]});
							countyData.deaths.datasets[1].data.push({x: value[0], y: value[5]});
						}

						if(value[1] === 'Kauai') {
							countyData.cases.datasets[2].data.push({x: value[0], y: value[4]});
							countyData.deaths.datasets[2].data.push({x: value[0], y: value[5]});
						}

						if(value[1] === 'Maui') {
							countyData.cases.datasets[3].data.push({x: value[0], y: value[4]});
							countyData.deaths.datasets[3].data.push({x: value[0], y: value[5]});
						}
					}
				});

				var countyCasesChartContainer = document.getElementById('countyCases');

				var countyCasesChart = new Chart(countyCasesChartContainer, {
	    			type: 'line',
	    			data: countyData.cases,
	   				options: {
	   					title: {
	   						display: true,
	   						fontColor: '#FFF',
	   						fontSize: 20,
		   					text: 'Cases - State of Hawaii Counties'
		   				},
		   				legend: {
		   					labels: {
		   						fontColor: '#fff',
		   						fontStyle: 'bold'
		   					}
		   				},
		   				scales: {
		   					yAxes: [
		   						{
		   							gridLines: {
		   								color: 'rgba(255,255,255,0.3)'
		   							},
		   							ticks: {
		   								color: 'rgba(255,255,255,0.3)',
		   								fontColor: '#fff'
		   							}
		   						}
		   					],
		   					xAxes: [
		   						{
		   							gridLines: {
		   								color: 'rgba(255,255,255,0.3)'
		   							},
		   							ticks: {
		   								color: 'rgba(255,255,255,0.3)',
		   								fontColor: '#fff'
		   							}
		   						}
		   					]
		   				}
	   				}
				});

				var countyDeathsChartContainer = document.getElementById('countyDeaths');

				var countyDeathsChart = new Chart(countyDeathsChartContainer, {
	    			type: 'line',
	    			data: countyData.deaths,
	   				options: {
	   					title: {
	   						display: true,
	   						fontColor: '#FFF',
	   						fontSize: 20,
		   					text: 'Deaths - State of Hawaii Counties'
		   				},
		   				legend: {
		   					labels: {
		   						fontColor: '#fff',
		   						fontStyle: 'bold'
		   					}
		   				},
		   				scales: {
		   					yAxes: [
		   						{
		   							gridLines: {
		   								color: 'rgba(255,255,255,0.3)'
		   							},
		   							ticks: {
		   								color: 'rgba(255,255,255,0.3)',
		   								fontColor: '#fff',
		   								beginAtZero: true
		   							}
		   						}
		   					],
		   					xAxes: [
		   						{
		   							gridLines: {
		   								color: 'rgba(255,255,255,0.3)'
		   							},
		   							ticks: {
		   								color: 'rgba(255,255,255,0.3)',
		   								fontColor: '#fff'
		   							}
		   						}
		   					]
		   				}
	   				}
				});

				var countyUpdated = counties.data[counties.data.length - 1][0];
				document.getElementById('countyCaseUpdate').innerHTML = 'Updated ' + countyUpdated;
				document.getElementById('countyDeathUpdate').innerHTML = 'Updated ' + countyUpdated;

				var countyCounts = {
					hawaii: {
						cases: {
							total: countyData.cases.datasets[0].data[countyData.cases.datasets[0].data.length - 1].y,
							change: countyData.cases.datasets[0].data[countyData.cases.datasets[0].data.length - 1].y - countyData.cases.datasets[0].data[countyData.cases.datasets[0].data.length - 2].y
						},
						deaths: {
							total: countyData.deaths.datasets[0].data[countyData.deaths.datasets[0].data.length - 1].y,
							change: countyData.deaths.datasets[0].data[countyData.deaths.datasets[0].data.length - 1].y - countyData.deaths.datasets[0].data[countyData.deaths.datasets[0].data.length - 2].y
						}
					},
					honolulu: {
						cases: {
							total: countyData.cases.datasets[1].data[countyData.cases.datasets[1].data.length - 1].y,
							change: countyData.cases.datasets[1].data[countyData.cases.datasets[1].data.length - 1].y - countyData.cases.datasets[1].data[countyData.cases.datasets[1].data.length - 2].y
						},
						deaths: {
							total: countyData.deaths.datasets[1].data[countyData.deaths.datasets[1].data.length - 1].y,
							change: countyData.deaths.datasets[1].data[countyData.deaths.datasets[1].data.length - 1].y - countyData.deaths.datasets[1].data[countyData.deaths.datasets[1].data.length - 2].y
						}
					},
					kauai: {
						cases: {
							total: countyData.cases.datasets[2].data[countyData.cases.datasets[2].data.length - 1].y,
							change: countyData.cases.datasets[2].data[countyData.cases.datasets[2].data.length - 1].y - countyData.cases.datasets[2].data[countyData.cases.datasets[2].data.length - 2].y
						},
						deaths: {
							total: countyData.deaths.datasets[2].data[countyData.deaths.datasets[2].data.length - 1].y,
							change: countyData.deaths.datasets[2].data[countyData.deaths.datasets[2].data.length - 1].y - countyData.deaths.datasets[2].data[countyData.deaths.datasets[2].data.length - 2].y
						}
					},
					maui: {
						cases: {
							total: countyData.cases.datasets[3].data[countyData.cases.datasets[3].data.length - 1].y,
							change: countyData.cases.datasets[3].data[countyData.cases.datasets[3].data.length - 1].y - countyData.cases.datasets[3].data[countyData.cases.datasets[3].data.length - 2].y
						},
						deaths: {
							total: countyData.deaths.datasets[3].data[countyData.deaths.datasets[3].data.length - 1].y,
							change: countyData.deaths.datasets[3].data[countyData.deaths.datasets[3].data.length - 1].y - countyData.deaths.datasets[3].data[countyData.deaths.datasets[3].data.length - 2].y
						}
					}

				}

				var hawaiiCountyCaseCountChange = document.getElementById('countyCaseCountHawaiiChange');
				hawaiiCountyCaseCountChange.innerHTML = '(' + (countyCounts.hawaii.cases.change > 0 ? '^' : '') + numberWithCommas(countyCounts.hawaii.cases.change) + ')';

				if(countyCounts.hawaii.cases.change <= 0) {
					hawaiiCountyCaseCountChange.classList.add('less');
				}
				else {
					hawaiiCountyCaseCountChange.classList.add('more');
				}

				var hawaiiCountyCaseCountup = new CountUp('countyCaseCountHawaii', 0, countyCounts.hawaii.cases.total);
				hawaiiCountyCaseCountup.start(function() {
					hawaiiCountyCaseCountChange.classList.add('show');
				});

				var honoluluCountyCaseCountChange = document.getElementById('countyCaseCountHonoluluChange');
				honoluluCountyCaseCountChange.innerHTML = '(' + (countyCounts.honolulu.cases.change > 0 ? '^' : '') + numberWithCommas(countyCounts.honolulu.cases.change) + ')';

				if(countyCounts.honolulu.cases.change <= 0) {
					honoluluCountyCaseCountChange.classList.add('less');
				}
				else {
					honoluluCountyCaseCountChange.classList.add('more');
				}

				var honoluluCountyCaseCountup = new CountUp('countyCaseCountHonolulu', 0, countyCounts.honolulu.cases.total);
				honoluluCountyCaseCountup.start(function() {
					honoluluCountyCaseCountChange.classList.add('show');
				});

				var kauaiCountyCaseCountChange = document.getElementById('countyCaseCountKauaiChange');
				kauaiCountyCaseCountChange.innerHTML = '(' + (countyCounts.kauai.cases.change > 0 ? '^' : '') + numberWithCommas(countyCounts.kauai.cases.change) + ')';

				if(countyCounts.kauai.cases.change <= 0) {
					kauaiCountyCaseCountChange.classList.add('less');
				}
				else {
					kauaiCountyCaseCountChange.classList.add('more');
				}

				var kauaiCountyCaseCountup = new CountUp('countyCaseCountKauai', 0, countyCounts.kauai.cases.total);
				kauaiCountyCaseCountup.start(function() {
					kauaiCountyCaseCountChange.classList.add('show');
				});

				var mauiCountyCaseCountChange = document.getElementById('countyCaseCountMauiChange');
				mauiCountyCaseCountChange.innerHTML = '(' + (countyCounts.maui.cases.change > 0 ? '^' : '') + numberWithCommas(countyCounts.maui.cases.change) + ')';

				if(countyCounts.maui.cases.change <= 0) {
					mauiCountyCaseCountChange.classList.add('less');
				}
				else {
					mauiCountyCaseCountChange.classList.add('more');
				}

				var mauiCountyCaseCountup = new CountUp('countyCaseCountMaui', 0, countyCounts.maui.cases.total);
				mauiCountyCaseCountup.start(function() {
					mauiCountyCaseCountChange.classList.add('show');
				});

				var hawaiiCountyDeathCountChange = document.getElementById('countyDeathCountHawaiiChange');
				hawaiiCountyDeathCountChange.innerHTML = '(' + (countyCounts.hawaii.deaths.change > 0 ? '^' : '') + numberWithCommas(countyCounts.hawaii.deaths.change) + ')';

				if(countyCounts.hawaii.deaths.change <= 0) {
					hawaiiCountyDeathCountChange.classList.add('less');
				}
				else {
					hawaiiCountyDeathCountChange.classList.add('more');
				}

				var hawaiiCountyDeathCountup = new CountUp('countyDeathCountHawaii', 0, countyCounts.hawaii.deaths.total);
				hawaiiCountyDeathCountup.start(function() {
					hawaiiCountyDeathCountChange.classList.add('show');
				});

				var honoluluCountyDeathCountChange = document.getElementById('countyDeathCountHonoluluChange');
				honoluluCountyDeathCountChange.innerHTML = '(' + (countyCounts.honolulu.deaths.change > 0 ? '^' : '') + numberWithCommas(countyCounts.honolulu.deaths.change) + ')';

				if(countyCounts.honolulu.deaths.change <= 0) {
					honoluluCountyDeathCountChange.classList.add('less');
				}
				else {
					honoluluCountyDeathCountChange.classList.add('more');
				}

				var honoluluCountyDeathCountup = new CountUp('countyDeathCountHonolulu', 0, countyCounts.honolulu.deaths.total);
				honoluluCountyDeathCountup.start(function() {
					honoluluCountyDeathCountChange.classList.add('show');
				});

				var kauaiCountyDeathCountChange = document.getElementById('countyDeathCountKauaiChange');
				kauaiCountyDeathCountChange.innerHTML = '(' + (countyCounts.kauai.deaths.change > 0 ? '^' : '') + numberWithCommas(countyCounts.kauai.deaths.change) + ')';

				if(countyCounts.kauai.deaths.change <= 0) {
					kauaiCountyDeathCountChange.classList.add('less');
				}
				else {
					kauaiCountyDeathCountChange.classList.add('more');
				}

				var kauaiCountyDeathCountup = new CountUp('countyDeathCountKauai', 0, countyCounts.kauai.deaths.total);
				kauaiCountyDeathCountup.start(function() {
					kauaiCountyDeathCountChange.classList.add('show');
				});

				var mauiCountyDeathCountChange = document.getElementById('countyDeathCountMauiChange');
				mauiCountyDeathCountChange.innerHTML = '(' + (countyCounts.maui.deaths.change > 0 ? '^' : '') + numberWithCommas(countyCounts.maui.deaths.change) + ')';

				if(countyCounts.maui.deaths.change <= 0) {
					mauiCountyDeathCountChange.classList.add('less');
				}
				else {
					mauiCountyDeathCountChange.classList.add('more');
				}

				var mauiCountyDeathCountup = new CountUp('countyDeathCountMaui', 0, countyCounts.maui.deaths.total);
				mauiCountyDeathCountup.start(function() {
					mauiCountyDeathCountChange.classList.add('show');
				});
			}
		};

		getCounties.open('GET', 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv', true);
		getCounties.send();
	}
	// ------------------------------------------------------------------------------------------------------------------------
});