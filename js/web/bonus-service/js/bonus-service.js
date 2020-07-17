/*
 * **************************************************************************************
 *
 * Dateiname:                 bonus-service.js
 * Projekt:                   foe-chrome
 *
 * erstellt von:              Daniel Siekiera <daniel.siekiera@gmail.com>
 * erstellt am:	              10.07.20, 15:44 Uhr
 *
 * Copyright © 2020
 *
 * **************************************************************************************
 */

// GEX started
FoEproxy.addHandler('GuildExpeditionService', 'getOverview', (data, postData) => {
	BonusService.InitBonus(true);
});

// World map
FoEproxy.addHandler('CampaignService', 'start', (data, postData) => {
	BonusService.InitBonus();
});

// GvG Map is opend
FoEproxy.addHandler('ClanBattleService', 'getContinent', (data, postData) => {
	BonusService.InitBonus();
});

// neihbor is visit
FoEproxy.addHandler('OtherPlayerService', 'visitPlayer', (data, postData) => {
	let OtherPlayer = data.responseData.other_player;
	let IsPlunderable = (OtherPlayer.is_neighbor && !OtherPlayer.is_friend && !OtherPlayer.is_guild_member);

	if (IsPlunderable) {
		BonusService.InitBonus();
	}
});

// Bonus get updated
FoEproxy.addHandler('BonusService', 'getLimitedBonuses', (data, postData) => {
	BonusService.Bonuses = data['responseData'];

	if($('#bonus-hud').length > 0){
		BonusService.CalcBonusData();
	}
});

// Guildfights enter
FoEproxy.addHandler('GuildBattlegroundService', 'getBattleground', (data, postData) => {
	BonusService.InitBonus();
});

// Guildfights would leave
FoEproxy.addHandler('AnnouncementsService', 'fetchAllAnnouncements', (data, postData) => {
	BonusService.HideBonusSidebar();
});


/**
 *
 * @type {{BonusTypes: [string, string, string, string, string], HideBonusSidebar: BonusService.HideBonusSidebar, SetBonusTypes: BonusService.SetBonusTypes, InitBonus: BonusService.InitBonus, Bonuses: [], CalcBonusData: BonusService.CalcBonusData, ShowBonusSidebar: BonusService.ShowBonusSidebar}}
 */
let BonusService = {
	
	Bonuses: [],
	BonusTypes: [
		'first_strike',
		'spoils_of_war',
		'diplomatic_gifts',
		'missile_launch',
		'aid_goods'
	],

	/**
	 * InitBonus with offset for GEX
	 *
	 * @param isGex
	 * @constructor
	 */
	InitBonus: (isGex = false)=> {
		let bt = BonusService.BonusTypes,
			exist = false;

		// check if player has some of these 4 bonuses
		for(let i in bt)
		{
			if(!bt.hasOwnProperty(i)) break;

			BonusService.Bonuses.forEach((arr)=>{
				if(arr['type'].includes(bt[i])){
					exist = true;
					return false;
				}
			});

			if(exist === true) break;
		}

		// no? exit...
		if(exist === false){
			return;
		}

		if($('#bonus-hud').length === 0){
			HTML.AddCssFile('bonus-service');

			// wait 2s
			setTimeout(()=>{
				BonusService.ShowBonusSidebar(isGex);
			},2000);
		}
	},


	/**
	 * Create a wrapper "hud" for the icons
	 * 
	 * @param isGex
	 * @constructor
	 */
	ShowBonusSidebar: (isGex)=> {

		let div = $('<div />');

		div.attr({
			id: 'bonus-hud',
			class: 'game-cursor'
		});

		if(isGex){
			div.css({
				top: 382,
				right: 62
			});
		}

		$('body').append(div).promise().done(function(){
			BonusService.SetBonusTypes();
		});
	},


	/**
	 * Removes the bonus-Hud
	 */
	HideBonusSidebar: ()=> {
		if($('#bonus-hud').length > 0){
			$('#bonus-hud').fadeToggle(function(){
				$(this).remove();
			});
		}
	},


	/**
	 * Box content
	 */
	SetBonusTypes: ()=> {
		const bt = BonusService.BonusTypes,
			d = BonusService.Bonuses,
			hud = $('#bonus-hud');

		for(let i in bt)
		{
			if(!bt.hasOwnProperty(i)){
				break;
			}

			let b = d.find(e => (e['type'] === bt[i]));

			if(b !== undefined){
				let sp = $('<div />'),
					sb = $('<span />'),
					si = $('<span />');

				sp.attr({
					class: `hud-btn`
				});

				sb.attr({
					class: `${bt[i]}-icon icon`
				});

				si.attr({
					id: `${bt[i]}-bonus`,
					class: 'bonus'
				});

				if(b['amount'] === undefined || b['amount'] === -1){
					sp.addClass('hud-btn-red');
					si.css({
						display: 'none'
					});

				} else {
					si.text(b['amount']);
				}

				hud.append( sp.append(sb).append(si) );
			}
		}
	},


	/**
	 * Show the bonus amount
	 */
	CalcBonusData: ()=> {
		const bt = BonusService.BonusTypes,
			d = BonusService.Bonuses,
			hud = $('#bonus-hud');

		for(let i in bt)
		{
			if(!bt.hasOwnProperty(i)){
				break;
			}

			let b = d.find(e => (e['type'] === bt[i]));

			if(b !== undefined){

				let si = hud.find(`#${b['type']}-bonus`),
					a = parseInt(si.text());

				// Bonus is empty
				if(b['amount'] === undefined || b['amount'] === -1){
					si.closest('.hud-btn').addClass('hud-btn-red');
					si.hide();
				}

				// Bonus ticker down, when changed
				else if(a !== b['amount']) {
					si.text(b['amount']);

					si.addClass('bonus-blink');

					setTimeout(()=>{
						si.removeClass('bonus-blink');
					}, 3500);
				}
			}
		}
	},
}