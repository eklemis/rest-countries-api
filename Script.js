class Theme {
	static dark = "DARK";
	static light = "LIGHT";
}
class CountryRenderOpt {
	static summary = "SUMMARY";
	static detail = "DETAIL";
	static asborder = "AS BORDER";
}
class ProgressComp {
	constructor(parent) {
		this.element = document.createElement("div");
		this.element.className = "circle-progress";
		this.element.innerHTML = "<div></div>";
		this._render(parent);
	}
	hide() {
		this.element.style.display = "none";
	}
	show() {
		this.element.style.display = "block";
	}
	_render(parent) {
		parent.appendChild(this.element);
	}
}
class Region {
	static all = "all";
	static africa = "africa";
	static america = "america";
	static asia = "asia";
	static europe = "europe";
	static oceania = "oceania";
}
class CountryComp {
	constructor(countryObj, renderOpt, owner, root) {
		this.soul = countryObj;
		this.owner = owner;
		this.root = root;
		this.borders = [];
		switch (renderOpt) {
			case CountryRenderOpt.summary:
				this.renderSumary();
				break;
			case CountryRenderOpt.detail:
				this.renderDetail();
				break;
			case CountryRenderOpt.asborder:
				this.renderAsBorder();
				break;
		}
	}
	renderSumary = () => {
		let parentComp = document.querySelector("div.countries-wrapper");
		const countryComp = document.createElement("div");
		countryComp.className = "country-sum";
		const body = `
					<img src="${this.soul.flags.png}" alt="" class="flag" />
					<section class="country-info">
						<h2>${this.soul.name}</h2>
						<p><span class="info-label">Population: </span>${this.soul.population}</p>
						<p><span class="info-label">Region: </span>${this.soul.region}</p>
						<p><span class="info-label">Capital: </span>${this.soul.capital}</p>
					</section>
        `;
		countryComp.innerHTML = body;
		countryComp.addEventListener("click", this.renderDetail);
		parentComp.appendChild(countryComp);
	};
	renderBack = () => {
		this.renderDetail();
	};
	renderDetail = () => {
		const parentComp = document.querySelector("main");
		parentComp.innerHTML = "";

		//Construct new content to replace previous content
		const countryDetailComp = document.createElement("div");
		countryDetailComp.className = "country-detail";

		const detailBody = `
        <a href="#" class="back-btn">Back</a>
        <div class="wrapper">
            <img src="${this.soul.flags.png}" alt="" class="flag" />
            <section class="country-detail-info">
                <h2>${this.soul.name}</h2>
                <div class="info-wrapper">
                    <div class="detail-info">
                        <p><span class="info-label">Native Name:</span>${
													this.soul.nativeName
												}</p>
                        <p><span class="info-label">Population:</span>${
													this.soul.population
												}</p>
                        <p><span class="info-label">Region:</span>${
													this.soul.region
												}</p>
                        <p><span class="info-label">Sub Region:</span>${
													this.soul.subregion
												}</p>
                        <p><span class="info-label">Capital:</span>${
													this.soul.capital
												}</p>
                    </div>
                    <div class="detail-info">
                        <p><span class="info-label">Top Level Domain: </span>${
													this.soul.topLevelDomain
												}</p>
                        <p><span class="info-label">Currencies: </span>${this._extractCurrencies()}</p>
                        <p><span class="info-label">Languages: </span>${this._extractLanguages()}</p>
                    </div>
                </div>
                <section class="border-infos">
                    <h3>Border Countries</h3>
                    <div class="border-infos">
                    </div>
                </div>
            </section>
        </div>                
        `;
		countryDetailComp.innerHTML = detailBody;
		parentComp.innerHTML = "";
		parentComp.appendChild(countryDetailComp);
		const backBtn = countryDetailComp.querySelector("a.back-btn");
		backBtn.addEventListener("click", () => {
			console.log(this);
			this.owner.renderBack();
		});

		/* Construct borders */
		console.log(this.soul.borders);
		if (this.soul.borders !== undefined) {
			this.soul.borders.forEach((item) => {
				console.log(item);
				let countryComp = this.root.allCountriesComp.filter(
					(country) => country.soul.alpha3Code === item
				);
				const borderCountryComp = new CountryComp(
					countryComp[0].soul,
					CountryRenderOpt.asborder,
					this,
					this.root
				);
				this.borders.push(borderCountryComp);
			});
		}

		/* Render borders */
	};
	renderAsBorder = () => {
		const parent = document.querySelector("div.border-infos");
		if (parent !== undefined) {
			const borderComp = document.createElement("a");
			borderComp.className = "border-country";
			borderComp.setAttribute("href", "#");
			borderComp.innerText = this.soul.alpha3Code;
			borderComp.addEventListener("click", this.renderDetail);
			parent.appendChild(borderComp);
		}
	};
	//Helpers
	_extractCurrencies = () => {
		const currArrObj = this.soul.currencies;
		let res = "";
		let idx = 0;
		currArrObj.forEach((curr) => {
			res += curr.name;
			if (idx < currArrObj.length - 2) res += ", ";
			idx++;
		});
		return res;
	};
	_extractLanguages = () => {
		const langArrObj = this.soul.languages;
		let res = "";
		let idx = 0;
		langArrObj.forEach((lang) => {
			res += lang.name;
			if (idx < langArrObj.length - 2) res += ", ";
			idx++;
		});
		return res;
	};
}
class App {
	constructor() {
		this.currentTheme = Theme.dark;
		this.filter = Region.all;
		this.allCountriesComp = [];
		//make above theme as default
		this._renderTheme();

		//register event handler for theme toggle
		const toggler = document.querySelector("header a");
		toggler.addEventListener("click", this._toggleThemeHandler);

		const progressComp = new ProgressComp(
			document.querySelector("div.countries-wrapper")
		);
		progressComp.show();

		//Start get data from restcountries API
		const gotCountries = new Promise((resolve, reject) => {
			const request = new XMLHttpRequest();
			function reqListener() {
				const respObj = JSON.parse(this.responseText);
				console.log(respObj);
				resolve(respObj);
			}
			request.addEventListener("load", reqListener);
			request.open("GET", "https://restcountries.com/v2/all");
			request.send();
		});
		const filterInput = document.querySelector("select");
		filterInput.addEventListener("change", () => {
			console.log(filterInput.value);
			this._changeFilter(filterInput.value);
		});
		const countryNameInput = document.querySelector("input");
		countryNameInput.addEventListener("keyup", () => {
			this.renderCountries(countryNameInput.value.trim());
		});

		gotCountries
			.then(
				(respObj) => {
					respObj.forEach((item) => {
						const countryComp = new CountryComp(
							item,
							CountryRenderOpt.summary,
							this,
							this
						);
						this.allCountriesComp.push(countryComp);
					});
				},
				(err) => {
					console.log("Error " + err);
				}
			)
			.then(() => {
				progressComp.hide();
			});
	}
	renderBack = () => {
		const main = document.querySelector("main");
		main.innerHTML = "";
		const formWrapper = document.createElement("div");
		formWrapper.className = "form-wrapper";
		formWrapper.innerHTML = `
            <input type="search" />
				<select name="regions" id="regions" aria-label="Filter by Region">
					<option value="all" selected>Filter by Region</option>
					<option value="africa">Africa</option>
					<option value="america">America</option>
					<option value="asia">Asia</option>
					<option value="europe">Europe</option>
					<option value="oceania">Oceania</option>
				</select>
            `;
		main.appendChild(formWrapper);
		//Add back event listener for select element
		const filterInput = formWrapper.querySelector("select");
		filterInput.value = this.filter;
		filterInput.addEventListener("change", () => {
			console.log(filterInput.value);
			this._changeFilter(filterInput.value);
		});
		//Add back event listener for search element
		const countryNameInput = formWrapper.querySelector("input");
		countryNameInput.addEventListener("keyup", () => {
			this.renderCountries(countryNameInput.value.trim());
		});

		let parentComp = document.createElement("div");
		parentComp.className = "countries-wrapper";
		main.appendChild(parentComp);
		this.renderCountries();
	};
	_changeFilter(newFilter) {
		this.filter = newFilter;
		this.renderCountries();
	}
	renderCountries = (name = "all") => {
		//clear the country div wrapper first
		document.querySelector("div.countries-wrapper").innerHTML = "";

		//start render all new filtered country
		this.allCountriesComp.forEach((item) => {
			let skipped = false;
			if (this.filter !== Region.all) {
				if (item.soul.region.toLowerCase() !== this.filter) {
					skipped = true;
				}
			}
			if (!skipped) {
				//console.log(item);
				if (name === "all") {
					item.renderSumary();
				}
				//filter by name as well
				else if (
					item.soul.name.toLowerCase().indexOf(name.toLowerCase()) != -1
				) {
					item.renderSumary();
				}
			}
		});
	};
	_renderTheme = () => {
		let className = this.currentTheme == Theme.dark ? "dark" : "light";
		/* change class of elements hold responsibility to change the comps color */
		const comps = [];
		const header = document.querySelector("header");
		const main = document.querySelector("main");
		const footer = document.querySelector("footer");
		comps.push(header);
		comps.push(main);
		comps.push(footer);
		comps.forEach((element) => {
			element.setAttribute("class", className);
		});
	};
	_toggleThemeHandler = () => {
		this.currentTheme =
			this.currentTheme == Theme.dark ? Theme.light : Theme.dark;
		this._renderTheme();
	};
}
__app = new App();
