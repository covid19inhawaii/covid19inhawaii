document.addEventListener('DOMContentLoaded', function() {
	// function for hawaii percent compared to US
	var percent = {
		us: {
			cases: null,
			deaths: null
		},
		state: {
			cases: null,
			deaths: null
		}
	}

	percentFunction = function() {
		if(percent.us.cases && percent.us.deaths && percent.state.cases && percent.state.deaths) {
			var casePercent = percent.state.cases / percent.us.cases * 100;
			var deathPercent = percent.state.deaths / percent.us.deaths * 100;
		}

		document.getElementById('casePercent').innerHTML = state + ' has ' + Math.round(casePercent * 100) / 100 + '% of total US cases.'
		document.getElementById('deathPercent').innerHTML = state + ' has ' + Math.round(deathPercent * 100) / 100 + '% of total US deaths.'
	}

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
						borderColor: 'rgba(240, 178, 122,1)',
						backgroundColor: 'rgba(240, 178, 122,0.2)'
					},
					{
						label: 'Deaths',
						data: [],
						borderColor: 'rgba(217, 136, 128,1)',
						backgroundColor: 'rgba(217, 136, 128,0.2)'				
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

			percent.state.cases = hawaii.datasets[0].data[hawaii.datasets[0].data.length - 1].y;
			percent.state.deaths = hawaii.datasets[1].data[hawaii.datasets[1].data.length - 1].y;

			percentFunction();

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
							countDiv: 'countyCaseCountHawaiiChange',
							changeDiv: 'countyCaseCountHawaii',
							total: countyData.cases.datasets[0].data[countyData.cases.datasets[0].data.length - 1].y,
							change: countyData.cases.datasets[0].data[countyData.cases.datasets[0].data.length - 1].y - countyData.cases.datasets[0].data[countyData.cases.datasets[0].data.length - 2].y
						},
						deaths: {
							countDiv: 'countyDeathCountHawaiiChange',
							changeDiv: 'countyDeathCountHawaii',
							total: countyData.deaths.datasets[0].data[countyData.deaths.datasets[0].data.length - 1].y,
							change: countyData.deaths.datasets[0].data[countyData.deaths.datasets[0].data.length - 1].y - countyData.deaths.datasets[0].data[countyData.deaths.datasets[0].data.length - 2].y
						}
					},
					honolulu: {
						cases: {
							countDiv: 'countyCaseCountHonoluluChange',
							changeDiv: 'countyCaseCountHonolulu',
							total: countyData.cases.datasets[1].data[countyData.cases.datasets[1].data.length - 1].y,
							change: countyData.cases.datasets[1].data[countyData.cases.datasets[1].data.length - 1].y - countyData.cases.datasets[1].data[countyData.cases.datasets[1].data.length - 2].y
						},
						deaths: {
							countDiv: 'countyDeathCountHonoluluChange',
							changeDiv: 'countyDeathCountHonolulu',
							total: countyData.deaths.datasets[1].data[countyData.deaths.datasets[1].data.length - 1].y,
							change: countyData.deaths.datasets[1].data[countyData.deaths.datasets[1].data.length - 1].y - countyData.deaths.datasets[1].data[countyData.deaths.datasets[1].data.length - 2].y
						}
					},
					kauai: {
						cases: {
							countDiv: 'countyCaseCountKauaiChange',
							changeDiv: 'countyCaseCountKauai',
							total: countyData.cases.datasets[2].data[countyData.cases.datasets[2].data.length - 1].y,
							change: countyData.cases.datasets[2].data[countyData.cases.datasets[2].data.length - 1].y - countyData.cases.datasets[2].data[countyData.cases.datasets[2].data.length - 2].y
						},
						deaths: {
							countDiv: 'countyDeathCountKauaiChange',
							changeDiv: 'countyDeathCountKauai',
							total: countyData.deaths.datasets[2].data[countyData.deaths.datasets[2].data.length - 1].y,
							change: countyData.deaths.datasets[2].data[countyData.deaths.datasets[2].data.length - 1].y - countyData.deaths.datasets[2].data[countyData.deaths.datasets[2].data.length - 2].y
						}
					},
					maui: {
						cases: {
							countDiv: 'countyCaseCountMauiChange',
							changeDiv: 'countyCaseCountMaui',
							total: countyData.cases.datasets[3].data[countyData.cases.datasets[3].data.length - 1].y,
							change: countyData.cases.datasets[3].data[countyData.cases.datasets[3].data.length - 1].y - countyData.cases.datasets[3].data[countyData.cases.datasets[3].data.length - 2].y
						},
						deaths: {
							countDiv: 'countyDeathCountMauiChange',
							changeDiv: 'countyDeathCountMaui',
							total: countyData.deaths.datasets[3].data[countyData.deaths.datasets[3].data.length - 1].y,
							change: countyData.deaths.datasets[3].data[countyData.deaths.datasets[3].data.length - 1].y - countyData.deaths.datasets[3].data[countyData.deaths.datasets[3].data.length - 2].y
						}
					}
				}

				function makeCountyCounts(type, county, countId, changeId) {
					var changeDiv = document.getElementById(changeId);
					changeDiv.innerHTML = '(' + (countyCounts[county][type].change > 0 ? '^' : '') + numberWithCommas(countyCounts[county][type].change) + ')';

					if(countyCounts[county][type].change <= 0) {
						changeDiv.classList.add('less');
					}
					else {
						changeDiv.classList.add('more');
					}

					var count = new CountUp(countId, 0, countyCounts[county][type].total);
					count.start(function() {
						changeDiv.classList.add('show');
					});
				}

				for(var key in countyCounts) {
				    if(countyCounts.hasOwnProperty(key)) {
				        makeCountyCounts('cases', key, countyCounts[key].cases.changeDiv, countyCounts[key].cases.countDiv);
				        makeCountyCounts('deaths', key, countyCounts[key].deaths.changeDiv, countyCounts[key].deaths.countDiv);
				    }
				}
			}
		};

		getCounties.open('GET', 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv', true);
		getCounties.send();
	}
	// ------------------------------------------------------------------------------------------------------------------------

	// build US chart
	// ------------------------------------------------------------------------------------------------------------------------
	var getUs = new XMLHttpRequest();

	getUs.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			var usData = Papa.parse(this.responseText);

			// chart data
			var us = {
				labels: [],
				datasets: [
					{
						label: 'Cases',
						data: [],
						borderColor: 'rgba(240, 178, 122,1)',
						backgroundColor: 'rgba(240, 178, 122,0.2)'
					},
					{
						label: 'Deaths',
						data: [],
						borderColor: 'rgba(217, 136, 128,1)',
						backgroundColor: 'rgba(217, 136, 128,0.2)'				
					}
				]
			}

			usData.data.splice(0,1);

			usData.data.forEach(function(value) {
				us.labels.push(value[0])

				us.datasets[0].data.push({x: value[0], y: value[1]});    
				us.datasets[1].data.push({x: value[0], y: value[2]});
			});

			var counts = {
				cases: {
					total: us.datasets[0].data[us.datasets[0].data.length - 1].y,
					change: us.datasets[0].data[us.datasets[0].data.length - 1].y - us.datasets[0].data[us.datasets[0].data.length - 2].y,
				},
				deaths: {
					total: us.datasets[1].data[us.datasets[1].data.length - 1].y,
					change: us.datasets[1].data[us.datasets[1].data.length - 1].y - us.datasets[1].data[us.datasets[1].data.length - 2].y,
				}
			}

			percent.us.cases = us.datasets[0].data[us.datasets[0].data.length - 1].y;
			percent.us.deaths = us.datasets[1].data[us.datasets[1].data.length - 1].y;

			percentFunction();

			var usCaseCount = document.getElementById('usCaseCount');
			var usCaseCountChange = document.getElementById('usCaseCountChange');
			var usDeathCount = document.getElementById('usDeathCount');
			var usDeathCountChange = document.getElementById('usDeathCountChange');

			usCaseCount.innerHTML = counts.cases.total;
			usCaseCountChange.innerHTML = '(' + (counts.cases.change > 0 ? '^' : '') + numberWithCommas(counts.cases.change) + ')';
			usDeathCount.innerHTML = counts.deaths.total;
			usDeathCountChange.innerHTML = '(' + (counts.deaths.change > 0 ? '^' : '') + numberWithCommas(counts.deaths.change) + ')';

			if(counts.cases.change <= 0) {
				usCaseCountChange.classList.add('less');
			}
			else {
				usCaseCountChange.classList.add('more');
			}

			if(counts.deaths.change <= 0) {
				usDeathCountChange.classList.add('less');
			}
			else {
				usDeathCountChange.classList.add('more');
			}

			var usCasecount = new CountUp('usCaseCount', 0, counts.cases.total);
			usCasecount.start(function() {
				usCaseCountChange.classList.add('show');
				document.getElementById('casePercent').classList.add('show');
			});

			var usDeathount = new CountUp('usDeathCount', 0, counts.deaths.total);
			usDeathount.start(function() {
				usDeathCountChange.classList.add('show');
				document.getElementById('deathPercent').classList.add('show');
			});

			var usChartContainer = document.getElementById('usChart');

			var usChart = new Chart(usChartContainer, {
    			type: 'line',
    			data: us,
   				options: {
   					title: {
   						display: true,
   						fontColor: '#FFF',
   						fontSize: 20,
	   					text: 'Cases and Deaths - United States'
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
			
			var usUpdated = usData.data[usData.data.length - 1][0];
			document.getElementById('usUpdate').innerHTML = 'Updated ' + usUpdated;
		}
	};

	getUs.open('GET', 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us.csv', true);
	getUs.send();
});