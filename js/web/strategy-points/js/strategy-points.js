/*
 * **************************************************************************************
 *
 * Dateiname:                 strategy-points.js
 * Projekt:                   foe-chrome
 *
 * erstellt von:              Daniel Siekiera <daniel.siekiera@gmail.com>
 * erstellt am:	              22.12.19, 14:31 Uhr
 * zuletzt bearbeitet:       22.12.19, 14:31 Uhr
 *
 * Copyright © 2019
 *
 * **************************************************************************************
 */

FoEproxy.addHandler('ResourceShopService', 'getContexts', (data)=> {
	if (data['responseData']['0']['context'] !== 'forgePoints') {
		return;
	}

	let offer = data.responseData[0].offers[0];
	StrategyPoints.RefreshBuyableForgePoints(offer.formula);
});

FoEproxy.addHandler('ResourceShopService', 'buyOffer', (data)=> {
	if (data['responseData']['gains'] === undefined || data['responseData']['gains']['resources'] === undefined || data['responseData']['gains']['resources']['strategy_points'] === undefined) {
		return;
	}
	StrategyPoints.RefreshBuyableForgePoints(data.responseData.formula);
});

window.addEventListener('resize', ()=>{
    StrategyPoints.HandleWindowResize();
});

// GEX started
FoEproxy.addHandler('GuildExpeditionService', 'getOverview', (data, postData) => {
	ActiveMap = 'gex';
	StrategyPoints.ShowFPBar();
});

// Guildfights enter
FoEproxy.addHandler('GuildBattlegroundService', 'getBattleground', (data, postData) => {
	StrategyPoints.ShowFPBar();
});

// main is entered
FoEproxy.addHandler('AnnouncementsService', 'fetchAllAnnouncements', (data, postData) => {
	StrategyPoints.HideFPBar();
});

/**
 * @type {{readonly AvailableFP: *|number, OldStrategyPoints: number, HandleWindowResize: StrategyPoints.HandleWindowResize, RefreshBuyableForgePoints: StrategyPoints.RefreshBuyableForgePoints, RefreshBar: StrategyPoints.RefreshBar, InventoryFP: number}}
 */
let StrategyPoints = {
	OldStrategyPoints: 0,
	InventoryFP: 0,


	/**
	 * Screen-size hax
	 *
	 * @constructor
	 */
	HandleWindowResize: () => {

        if ( window.innerWidth < 1250 && ActiveMap !== 'gex'){
            $('#fp-bar').removeClass('medium-screen');
            $('#fp-bar').addClass('small-screen');
        }
        else if ( window.innerWidth < 1400 && ActiveMap !== 'gex'){
            $('#fp-bar').removeClass('small-screen');
            $('#fp-bar').addClass('medium-screen');
		}
        else {
            $('#fp-bar').removeClass('small-screen');
            $('#fp-bar').removeClass('medium-screen');
        }
	},


	ShowFPBar: ()=>{

		if(ActiveMap === 'main'){
			return ;
		}

		if( $('.fp-bar-main').length === 0){
			$('#fp-bar').append(`<div class="fp-bar-main"><div class="number"></div><div class="bars"></div></div>`);

		} else {
			$('.fp-bar-main').show();
		}

		// necessary to wait for gift in gg + diplomatic gift
		setTimeout(()=>{
			const availableFPs = (ResourceStock['strategy_points'] !== undefined ? ResourceStock['strategy_points'] : 0);

			$('.fp-bar-main').find('.number').text(availableFPs);

			const $bar = $('.fp-bar-main').find('.bars');

			// make empty
			$bar.find('span').remove();
			for (let i = 0; i < availableFPs; i++) {
				$bar.append(`<span />`);
				if (i === 9) { break; }
			}
		}, 800);

	},


	HideFPBar: ()=> {
		$('.fp-bar-main').hide();
	},


	/**
	 * Buyable FPs + formula
	 *
	 * @param formula
	 * @constructor
	 */
	RefreshBuyableForgePoints: (formula) => {

    	let amount = 0;
    	let currentlyCosts = formula.baseValue;
    	let boughtCount = formula.boughtCount;
    	let factor = formula.factor;

		for(let counter = 1; counter <= boughtCount; counter++) {
			currentlyCosts += factor;
		}

		for(let money = ResourceStock.money; money >= currentlyCosts; money--) {
			currentlyCosts += factor;
			money -= currentlyCosts;
			amount++;
		}

		if($('div.buyable-fp').length === 0) {
			$('#fp-bar').append(`<div class="buyable-fp"><div>${ HTML.Format(amount)}</div></div>`);

		} else {
			$('div.buyable-fp div').text(HTML.Format(amount));
		}
	},


	/**
	 * Tiny FP bar on top of the screen
	 *
	 * @param value
	 * @constructor
	 */
    RefreshBar: ( value ) => {
        // noch nicht im DOM?
		if( $('#fp-bar').length < 1 ){
			let div = $('<div />').attr({
				id: 'fp-bar',
				class: 'game-cursor'
			}).append( `<div class="fp-storage"><div>0</div></div>` );

			$('body').append(div);
            StrategyPoints.HandleWindowResize();
		}

		if ( isNaN( value ) ){ return; }
		StrategyPoints.InventoryFP = value;

		let delimiter = Number(1000).toLocaleString().substring(1,2);

		// the animation function checks if start_value != end_value
		$('#fp-bar div.fp-storage div').easy_number_animate({
			start_value: StrategyPoints.OldStrategyPoints,
			end_value: StrategyPoints.InventoryFP,
			delimiter: delimiter,
			duration: 750,
			after: (el, val) => {
				// this seems to be necessary due to a bug with the easy_number_animate
				// jQuery plugin = if many animations run in a quick succession the order
				// in which they finish is not guaranteed!
				el.text( HTML.Format( StrategyPoints.InventoryFP ) );
			}
		});

		StrategyPoints.OldStrategyPoints = StrategyPoints.InventoryFP;
	},


	/**
	 * Returns the stock and the bar FPs
	 *
	 * @returns {*|number}
	 * @constructor
	 */
	get AvailableFP() {
		let Ret = (ResourceStock['strategy_points'] !== undefined ? ResourceStock['strategy_points'] : 0);
		Ret += StrategyPoints.InventoryFP;
		return Ret;
	},
};
