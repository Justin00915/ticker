//#region getting html elements and adding listeners
////Score display
var score_display = document.getElementById("score_display")

////Ticker Area
var penalty_level_display = document.getElementById("penalty_level_display")
var penalty_effect_display = document.getElementById("penalty_effect_display")

var ticker_perfect_zone = document.getElementById("ticker_perfect_zone")
var ticker_pointer = document.getElementById("ticker_pointer")

var ticker_button = document.getElementById("ticker_button")
ticker_button.addEventListener("mousedown", () => ticker_button_clicked())

////Upgrades
//base click score upgrade
var b_cl_sc_upgr_descr = document.getElementById("base_click_score_upgrade_description")
var b_cl_sc_upgr_button = document.getElementById("base_click_score_upgrade_button")
b_cl_sc_upgr_button.addEventListener("click", () => base_cl_sc_upgr_button_clicked())

//perfect multiplier upgrade
var p_mult_upgr_descr = document.getElementById("perfect_multiplier_upgrade_description")
var p_mult_upgr_button = document.getElementById("perfect_multiplier_upgrade_button")
p_mult_upgr_button.addEventListener("click", () => p_mult_upgr_button_clicked())

//perfect zone width
var p_zone_width_upgr_descr = document.getElementById("perfect_zone_width_upgrade_description")
var p_zone_width_upgr_button = document.getElementById("perfect_zone_width_upgrade_button")
p_zone_width_upgr_button.addEventListener("click", () =>p_zone_width_upgr_button_clicked())
//#endregion

//#region class defs
class upgrade{
    constructor (effect, effect_scaler, effect_scaling_mode, //true exp, false linear
        cost, cost_scaler, cost_scaling_mode, //true exp, false linear
        upgrade_description, upgrade_button, unit= ""){
        this.effect = effect
        this.effect_scaler = effect_scaler
        this.effect_scaling_mode = effect_scaling_mode

        this.cost = cost
        this.cost_scaler = cost_scaler
        this.cost_scaling_mode = cost_scaling_mode

        this.upgrade_description = upgrade_description
        this.upgrade_button = upgrade_button
        this.unit = unit
    }
    
    upgrade(){
        //Change effect and cost according to their scaling mode
        this.effect =(this.effect_scaling_mode)?
        this.effect * this.effect_scaler : this.effect + this.effect_scaler
        
        this.cost = (this.cost_scaling_mode)?
        this.cost * this.cost_scaler : this.cost + this.cost_scaler

        this.update_UI()
    }

    update_UI(){
        this.upgrade_description.innerHTML = 
        `Effect:<br>${custom_round(this.effect, 2)}${this.unit} -> ${custom_round(this.get_next_effect_lvl(), 2)}${this.unit}`
        this.upgrade_button.innerHTML = `${custom_round(this.cost, 2)}`
    }

    get_next_effect_lvl(){
        var val = (this.effect_scaling_mode)?
        this.effect * this.effect_scaler : this.effect + this.effect_scaler
        
        return val
    }
}
//#endregion

//#region initializing
var score = 0;

var ticker_frequency = 1 //per s
var ticker_pointer_progress = 0 //-MAX_TICKER_POINTER_PROGRESS <= ticker_pointer_progress <= MAX_TICKER_POINTER_PROGRESS 
const MAX_TICKER_POINTER_PROGRESS = 49.4 //source: just trust me alright?
var ticker_pointer_direction = 1 //1: to the right ||-1: to the left

//penalty for repeatedly clicking at the wrong time
var penalty_strength = 2/3 //1: none at all ||0: game-breakingly strong
var penalty_level = 0
var max_penalty_level = 5

var base_click_score_upgrade = new upgrade
    (0.2, 0.1, false, 15, 1.05, true, b_cl_sc_upgr_descr, b_cl_sc_upgr_button)
    base_click_score_upgrade.update_UI()

var perfect_multiplier_upgrade = new upgrade
    (5, 0.5, false, 5, 1.05, true, p_mult_upgr_descr, p_mult_upgr_button)
    perfect_multiplier_upgrade.update_UI()

var perfect_zone_width_upgrade =  new upgrade
    (7, 1, false, 35, 1.05, true, p_zone_width_upgr_descr, p_zone_width_upgr_button, "%")
    perfect_zone_width_upgrade.update_UI()

var continuous_logic_process = setInterval(continuous_logic, 1000/60)
//#endregion

//#region continous function shenanigans
function continuous_logic(){
    animate_ticker_pointer()
}

function animate_ticker_pointer(){
    ticker_pointer_progress += ticker_pointer_direction * 2.5
    
    //stop poinetr and turn it around if it gets to the edge
    if (Math.abs(ticker_pointer_progress) >= MAX_TICKER_POINTER_PROGRESS){
        ticker_pointer_progress = MAX_TICKER_POINTER_PROGRESS
        
        ticker_pointer_progress *= ticker_pointer_direction
        ticker_pointer_direction *= -1
    }
    ticker_pointer.style.left = `${50 + ticker_pointer_progress}%`
}
//#endregion

//#region ticker-button clicked
function ticker_button_clicked(){
    score_gained = base_click_score_upgrade.effect
    
    //Perfect case
    if (clicker_pointer_intersects_perfect_area()){
        score_gained *= perfect_multiplier_upgrade.effect * (penalty_strength ** penalty_level) 
        change_score(score_gained)
        
        change_penalty_level(0, true)
        return
    }
    
    change_score(score_gained * (penalty_strength ** penalty_level))
    change_penalty_level(1)
}
//#endregion

//#region upgrade-button clicks
function base_cl_sc_upgr_button_clicked(){
    if (score < base_click_score_upgrade.cost) return
    change_score(-base_click_score_upgrade.cost)

    base_click_score_upgrade.upgrade()
}

function p_mult_upgr_button_clicked(){
    if (score < perfect_multiplier_upgrade.cost) return
    change_score(-perfect_multiplier_upgrade.cost)
    
    perfect_multiplier_upgrade.upgrade()
}

function p_zone_width_upgr_button_clicked(){
    if (score < perfect_zone_width_upgrade.cost) return
    change_score(-perfect_zone_width_upgrade.cost)
    perfect_zone_width_upgrade.upgrade()
    
    ticker_perfect_zone.style.width = String(perfect_zone_width_upgrade.effect)+"%"
}
//#endregion

//#region miscellaneous functions, ex: changers and intersecters
function change_score(amount){
    score += amount
    score_display.innerHTML = String(custom_round(score, 2))
}

function change_penalty_level(amount, in_set_mode= false){
    if(in_set_mode) penalty_level = amount
    else penalty_level += amount

    if(penalty_level < 0) penalty_level = 0
    if(penalty_level > max_penalty_level) penalty_level = max_penalty_level

    penalty_level_display.innerHTML = `Penalty Level: ${penalty_level}`
    penalty_effect_display.innerHTML = `Effect: score * ${custom_round(penalty_strength ** penalty_level, 3)}`
}

function clicker_pointer_intersects_perfect_area(){
    let rect1 = ticker_pointer.getBoundingClientRect()
    let rect2 = ticker_perfect_zone.getBoundingClientRect()
    let overlap = !(rect1.right < rect2.left || rect1.left > rect2.right || 
        rect1.bottom < rect2.top || rect1.top > rect2.bottom)
        
        return overlap
    }
//#endregion

//#region helpers
function custom_round(number, decimal_places){
    return Math.round(number * 10**decimal_places)/(10**decimal_places)
}
//#endregion

//#region unused code
// function ticker_button_clicked(){
    //     ticker_button.style.animation = 
    //     `ticker_blinking cubic-bezier(0, 1, 0, 1) alternate-reverse ${1/(2*frequency)}s infinite`
    
    //     let t = new Date()
    //     curr_time = t.getTime()
    
    //     change_score(determine_click_score(sequence_start, frequency))
    //     if(sequence_start == null) {sequence_start = curr_time}
    
    //     prev_time = curr_time
    // }
    // let started = false
    
    // function ticker_button_hovering_end(){
        //     ticker_button.style.animation = ""
        //     sequence_start = null
        // }
        
// function determine_click_score(sequence_start, frequency){
//     let click_score = base_click_score
    
//     //if click is first click in sequence return base score
//     if (sequence_start == null){
//         return click_score
//     }

//     //determine how far the click was off-rhythm
//     let t = new Date()
//     let off_by = Math.abs(t-sequence_start)/1000 % (1/frequency)
//     if (off_by < rhythm_tolerance){
//         click_score *= perfect_multiplier 
//     }
    
//     return click_score
//}
//#endregion