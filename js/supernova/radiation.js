const RADIATION = {
    names: ["Radio","Microwave","Infrared","Visible","Ultraviolet","X-ray","γ-ray"],
    unls: ["0","1e6","1e13","1e20","5e26","5e29"],
    hz_gain() {
        let x = E(1)
        x = x.mul(tmp.radiation.ds_eff[0])
        if (player.supernova.tree.includes('rad1')) x = x.mul(tmp.supernova.tree_eff.rad1||1)
        return x
    },
    hz_effect() {
        let x = player.supernova.radiation.hz.add(1).root(3)
        return x
    },
	ds_gains: ["1", "1", "1", "1", "0.005", "0.00002"],
    ds_gain(i) {
        if (i>0&&player.supernova.radiation.hz.lt(RADIATION.unls[i])) return E(0)
        let x = E(RADIATION.ds_gains[i])
        if (player.supernova.tree.includes('rad2')) x = x.mul(tmp.supernova.tree_eff.rad2||1)
        if (i == 3 && player.atom.elements.includes(70)) x = x.mul(10)
        if (i<RAD_LEN-1) {
            if (player.supernova.tree.includes('rad1') && player.supernova.radiation.hz.gte(RADIATION.unls[i+1])) x = x.mul(tmp.supernova.tree_eff.rad1||1)
            x = x.mul(tmp.radiation.ds_eff[i+1])
        }
        x = x.mul(tmp.radiation.bs.eff[3*i])
        return x
    },
    ds_eff(i) {
        let x = player.supernova.radiation.ds[i].add(1).root(3)
        return x
    },
    getBoostData(i) {
        let b = player.supernova.radiation.bs[i]
        let [f1,f2,f3] = [2+i/2,RADIATION.getBoostScaling(i),(i*0.5+1)**2*10]
        let cost = E(f1).pow(b.pow(f2)).mul(f3)

        let d = player.supernova.radiation.ds[Math.floor(i/2)]
        let bulk = d.lt(f3) ? E(0) : d.div(f3).max(1).log(f1).max(0).root(f2).add(1).floor()

        return [cost,bulk]
    },
    getBoostScaling(i) {
		let f2 = 1.3+i*0.05
		if (tmp.radiation.bs.eff[17] && i % 2 == 1) f2 -= tmp.radiation.bs.eff[17][1]
		return f2
    },
    getLevelEffect(i) {
        let x = this.boosts[i].eff(tmp.radiation.bs.lvl[i].add(tmp.radiation.bs.bonus_lvl[i]))
        return x
    },
    getbonusLevel(i) {
        let x = E(0)
        if (i < 8) x = x.add(RADIATION.applyBonusExp(tmp.radiation.bs.eff[8]&&tmp.radiation.bs.eff[8],8,i))
        if (i < 12 && player.atom.elements.includes(69)) x = x.add(1)
        if (i < 17) x = x.add(RADIATION.applyBonusExp(tmp.radiation.bs.eff[17]&&tmp.radiation.bs.eff[17][0],17,i))
        return x
    },
    applyBonusExp(x,a,b) {
		if (!x) x = E(0)
		var e = RADIATION.bonusExp(a,b)
		if (e <= 1) return x
		return x.add(1).pow(e).sub(1)
    },
    bonusExp(a,b) {
		if (!player.supernova.tree.includes("rad3")) return 1
		a = Math.floor(a / 3) * 2
		b = Math.floor(b / 3) * 2
        return RADIATION.getBoostScaling(a) / RADIATION.getBoostScaling(b)
    },
    buyBoost(i) {
        let [cost, bulk, j] = [tmp.radiation.bs.cost[i], tmp.radiation.bs.bulk[i], Math.floor(i/2)]
        if (player.supernova.radiation.ds[j].gte(cost) && bulk.gt(player.supernova.radiation.bs[i])) {
            player.supernova.radiation.bs[i] = player.supernova.radiation.bs[i].max(bulk)
            let [f1,f2,f3] = [2+i/2,RADIATION.getBoostScaling(i),(i*0.5+1)**2*10]
            player.supernova.radiation.ds[j] = player.supernova.radiation.ds[j].sub(E(f1).pow(bulk.sub(1).pow(f2)).mul(f3)).max(0)
        }
    },
    boosts: [
        {
            title: `Radio Boost`,
            eff(b) {
                let x = player.supernova.radiation.hz.add(1).log10().add(1).pow(b).softcap(1e30,0.5,0)
                return x
            },
            desc(x) { return `Radiowave is boosted by ${format(x)}x (based on Frequency)` },
        },{
            title: `Tickspeed Boost`,
            eff(b) {
                let x = b.add(1).root(2)
                return x
            },
            desc(x) { return `Non-bonus tickspeed is ${format(x)}x stronger` },
        },{
            title: `Mass-Softcap Boost`,
            eff(b) {
                let x = b.add(1).root(4)
                return x
            },
            desc(x) { return `Softcap^3 from mass gain start ^${format(x)} later` },
        },{
            title: `Microwave Boost`,
            eff(b) {
                let x = player.supernova.radiation.ds[0].add(1).log10().add(1).pow(b).softcap(1e30,0.5,0)
                return x
            },
            desc(x) { return `Microwave is boosted by ${format(x)}x (based on Radio)` },
        },{
            title: `BH-Exponent Boost`,
            eff(b) {
                let x = b.root(2).div(100)
                return x.min(.05)
            },
            desc(x) { return `Exponent from the mass of BH formula is increased by ${format(x)} (hardcapped to 0.05)` },
        },{
            title: `BH-Condenser Boost`,
            eff(b) {
                let x = b.add(1).pow(2)
                return x.softcap(100,0.5,0)
            },
            desc(x) { return `Non-bonus BH condenser is ${format(x)}x stronger`+(x.gte(100)?" <span class='soft'>(softcapped)</span>":"") },
        },{
            title: `Infrared Boost`,
            eff(b) {
                let x = player.supernova.radiation.ds[1].add(1).log10().add(1).pow(b).softcap(1e30,0.5,0)
                return x
            },
            desc(x) { return `Infrared is boosted by ${format(x)}x (based on Microwave)` },
        },{
            title: `Photo-Gluon Boost`,
            eff(b) {
                let x = b.add(1).root(3)
                return x
            },
            desc(x) { return `1st Photon & Gluon upgrades are ${format(x)}x stronger` },
        },{
            title: `Meta-Boost I`,
            eff(b) {
                let x = b.root(2.5).div(1.75)
                return x
            },
            desc(x) { return `Add ${format(x)} levels to all above boosts` },
        },{
            title: `Visible Boost`,
            eff(b) {
                let x = player.supernova.radiation.ds[2].add(1).log10().add(1).pow(b).softcap(1e30,0.5,0)
                return x
            },
            desc(x) { return `Visible is boosted by ${format(x)}x (based on Infrared)` },
        },{
            title: `Cosmic-Ray Boost`,
            eff(b) {
                let x = b.add(1).root(3)
                return x
            },
            desc(x) { return `Cosmic Ray power is boosted by ${format(x)}x` },
        },{
            title: `Neturon-Star Boost`,
            eff(b) {
                let x = player.supernova.radiation.hz.add(1).log10().add(1).pow(b)
                return x
            },
            desc(x) { return `Neutron Star is boosted by ${format(x)}x (based on Frequency)` },
        },{
            title: `Ultraviolet Boost`,
            eff(b) {
                let x = player.supernova.radiation.ds[3].add(1).log10().add(1).pow(b).softcap(1e30,0.5,0)
                return x
            },
            desc(x) { return `Ultraviolet is boosted by ${format(x)}x (based on Visible)` },
        },{
            title: `Tickspeed-Softcap Boost`,
            eff(b) {
                let x = E(1e3).pow(b.pow(0.9))
                return x
            },
            desc(x) { return `Tickspeed power's softcap starts ${format(x)}x later` },
        },{
            title: `Meta-Tickspeed Boost`,
            eff(b) {
                let x = E(1.1).pow(b)
                return x
            },
            desc(x) { return `Meta-Tickspeed starts ${format(x)}x later` },
        },{
            title: `X-Ray Boost`,
            eff(b) {
                let x = player.supernova.radiation.ds[4].add(1).log10().add(1).pow(b).softcap(1e30,0.5,0)
                return x
            },
            desc(x) { return `X-Ray is boosted by ${format(x)}x (based on Ultraviolet)` },
        },{
            title: `U-Fermion Boost`,
            eff(b) {
                let x = b.add(1).log(2).div(50).add(1)
                return x
            },
            desc(x) { return `U-Fermion boosts are ${format(x)}x stronger.` },
        },{
            title: `Meta Boost II / Synergy Boost`,
            eff(b) {
				let r = b.mul(player.supernova.radiation.ds[5].add(1).log10().pow(5/6)).pow(2/5)
                return [r.div(10), r.div(100).min(0.05).toNumber()]
            },
            desc(x) { return `Add ${format(x[0])} levels to all above boosts, reduce Velocity cost scalings by ^${format(x[1])}` },
        },

        /*
        {
            title: `Placeholder Boost`,
            eff(b) {
                let x = E(1)
                return x
            },
            desc(x) { return `Placeholder` },
        },
        */
    ],
}

const RAD_LEN = 6

function updateRadiationTemp() {
    tmp.radiation.unl = player.supernova.tree.includes("unl1")
    tmp.radiation.hz_gain = RADIATION.hz_gain()
    tmp.radiation.hz_effect = RADIATION.hz_effect()
    for (let x = 0; x < RAD_LEN; x++) {
        tmp.radiation.ds_gain[x] = RADIATION.ds_gain(x)
        tmp.radiation.ds_eff[x] = RADIATION.ds_eff(x)

        tmp.radiation.bs.sum[x] = player.supernova.radiation.bs[2*x].add(player.supernova.radiation.bs[2*x+1])

        for (let y = 0; y < 3; y++) {
            tmp.radiation.bs.lvl[3*x+y] = tmp.radiation.bs.sum[x].add(2-y).div(3).floor()//.softcap(10,0.75,0)
            tmp.radiation.bs.bonus_lvl[3*x+y] = RADIATION.getbonusLevel(3*x+y)
        }
        for (let y = 0; y < 2; y++) [tmp.radiation.bs.cost[2*x+y],tmp.radiation.bs.bulk[2*x+y]] = RADIATION.getBoostData(2*x+y)
    }
    for (let x = 0; x < RAD_LEN*3; x++) tmp.radiation.bs.eff[x] = RADIATION.getLevelEffect(x)
}

function setupRadiationHTML() {
    let new_table = new Element("radiation_table")
	let table = ``
    for (let x = 0; x < RAD_LEN; x++) {
        let name = RADIATION.names[x]
        let id = `rad_${x}`
        let [b1, b2] = [`rad_boost_${2*x}`,`rad_boost_${2*x+1}`]
        table += `
        <div id="${id}_div" class="table_center radiation">
            <div class="sub_rad" style="width: 450px">
                Your distance of ${name}'s wave is <span id="${id}_distance">0</span> meter.<br>Which multiples ${x==0?"Frequency":"distance of "+RADIATION.names[x-1]} gain by <span id="${id}_disEff">1</span>x
            </div><div class="table_center sub_rad" style="align-items: center">
                <button id="${b1}_btn" class="btn rad" onclick="RADIATION.buyBoost(${2*x})">
                    Aplitude: <span id="${b1}_lvl1">0</span><br>
                    Cost: <span id="${b1}_cost">0</span> meters
                </button><button id="${b2}_btn" class="btn rad" onclick="RADIATION.buyBoost(${2*x+1})">
                    Velocity: <span id="${b2}_lvl1">0</span><br>
                    Cost: <span id="${b2}_cost">0</span> meters
                </button>
            </div><div class="sub_rad" style="width: 100%">
                ${RADIATION.boosts[3*x].title} [<span id="rad_level_${3*x}">0</span>]: <span id="rad_level_${3*x}_desc">0</span><br>
                ${RADIATION.boosts[3*x+1].title} [<span id="rad_level_${3*x+1}">0</span>]: <span id="rad_level_${3*x+1}_desc">0</span><br>
                ${RADIATION.boosts[3*x+2].title} [<span id="rad_level_${3*x+2}">0</span>]: <span id="rad_level_${3*x+2}_desc">0</span>
            </div>
        </div>
        `
    }
	new_table.setHTML(table)
}

function updateRadiationHTML() {
    tmp.el.frequency.setTxt(format(player.supernova.radiation.hz,1)+" "+formatGain(player.supernova.radiation.hz,tmp.radiation.hz_gain))
    tmp.el.frequency_eff.setTxt(format(tmp.radiation.hz_effect))

    let rad_id = 1
    for (let x = 1; x < RAD_LEN; x++) {
        if (player.supernova.radiation.hz.lt(RADIATION.unls[x]||1/0)) break
        rad_id++
    }
    tmp.el.next_radiation.setTxt()

    tmp.el.next_radiation.setTxt(format(RADIATION.unls[rad_id]||1/0))
    tmp.el.unl_radiation.setTxt(RADIATION.names[rad_id])

    for (let x = 0; x < RAD_LEN; x++) {
        let unl = x==0||player.supernova.radiation.hz.gte(RADIATION.unls[x])
        let id = `rad_${x}`

        tmp.el[id+"_div"].setDisplay(unl)
        if (unl) {
            tmp.el[id+"_distance"].setTxt(format(player.supernova.radiation.ds[x],1)+" "+formatGain(player.supernova.radiation.ds[x],tmp.radiation.ds_gain[x]))
            tmp.el[id+"_disEff"].setTxt(format(tmp.radiation.ds_eff[x]))

            for (let y = 0; y < 2; y++) {
                let b = 2*x+y
                let id2 = `rad_boost_${b}`

                tmp.el[id2+"_lvl1"].setTxt(format(player.supernova.radiation.bs[b],0))
                tmp.el[id2+"_cost"].setTxt(format(tmp.radiation.bs.cost[b],1))
                tmp.el[id2+"_btn"].setClasses({btn: true, rad: true, locked: player.supernova.radiation.ds[x].lt(tmp.radiation.bs.cost[b])})
            }
            for (let y = 0; y < 3; y++) {
                let lvl = 3*x+y
                let id2 = `rad_level_${lvl}`
                tmp.el[id2].setTxt(format(tmp.radiation.bs.lvl[lvl],0)+(tmp.radiation.bs.bonus_lvl[lvl].gt(0)?" + "+format(tmp.radiation.bs.bonus_lvl[lvl]):""))
                tmp.el[id2+"_desc"].setHTML(RADIATION.boosts[lvl].desc(tmp.radiation.bs.eff[lvl]))
            }
        }
    }
}