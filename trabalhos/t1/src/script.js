function create_container(parent)
{
    let container = document.createElement("div");
    container.className = "container";
    container.id = parent;
    document.getElementById("viewer_container").appendChild(container);
}

function create_new_table(id, parent)
{
    let table = document.createElement("table");
    table.id = id;
    document.getElementById(parent).appendChild(table);
}

function create_label(parent, label)
{
    let type = document.createElement("p");
    type.innerHTML = label;
    type.className = "label";
    document.getElementById(parent).appendChild(type);
}

// nrzl means non return to zero level
// that is, the level represents the bit
// - is 0 and + is 1
function code_nrzl(sequence)
{
    const parent = "nrzl_container"
    const id = "nrzl_table";
    create_container(parent);
    create_label(parent, "NRZ-L");
    create_new_table(id, parent);

    let table = document.getElementById(id);
    let row_top = document.createElement("tr");
    let row_mid = document.createElement("tr");
    let row_bottom = document.createElement("tr");

    let ctop = document.createElement("td");
    let cmid = document.createElement("td");
    let cbottom = document.createElement("td");

    cmid.innerHTML = "0";

    ctop.classList.add("level_label");
    cmid.classList.add("level_label");
    cbottom.classList.add("level_label");

    row_top.appendChild(ctop);
    row_mid.appendChild(cmid);
    row_bottom.appendChild(cbottom);

    let last = sequence[0];

    for (let i = 0; i < sequence.length; i++) 
    {
        let ctop = document.createElement("td")
        let cmid = document.createElement("td")
        let cbottom = document.createElement("td")

        ctop.classList.add("indicator");
        ctop.classList.add("zero");
        cmid.classList.add("indicator");

        ctop.classList.add("signal");
        cmid.classList.add("signal");

        if (last != sequence[i])
        {
            cmid.classList.add("on_left");
            ctop.classList.add("on_left");
        }

        if (sequence[i] == 0)
        {
            cmid.classList.add("on_bottom");
        }

        else
        {
            ctop.classList.add("on_top");
        }

        cbottom.innerHTML = sequence[i];
        cbottom.classList.add("binary_label");

        row_top.appendChild(ctop);
        row_mid.appendChild(cmid);
        row_bottom.appendChild(cbottom);

        last = sequence[i];
    }

    table.appendChild(row_top);
    table.appendChild(row_mid);
    table.appendChild(row_bottom);
}

// nrzi means non return to zero invert
// inverted = 1; same = 0;
function code_nrzi(sequence)
{
    const parent = "nrzi_container"
    const id = "nrzi_table";
    create_container(parent);
    create_label(parent, "NRZ-I");
    create_new_table(id, parent);

    let table = document.getElementById(id);
    let row_top = document.createElement("tr");
    let row_mid = document.createElement("tr");
    let row_bottom = document.createElement("tr");

    let ctop = document.createElement("td");
    let cmid = document.createElement("td");
    let cbottom = document.createElement("td");

    cmid.innerHTML = "0";

    ctop.classList.add("level_label");
    cmid.classList.add("level_label");
    cbottom.classList.add("level_label");

    row_top.appendChild(ctop);
    row_mid.appendChild(cmid);
    row_bottom.appendChild(cbottom);

    let up = true;

    for (let i = 0; i < sequence.length; i++) 
    {
        let ctop = document.createElement("td")
        let cmid = document.createElement("td")
        let cbottom = document.createElement("td")

        ctop.classList.add("indicator");
        ctop.classList.add("zero");
        cmid.classList.add("indicator");

        ctop.classList.add("signal");
        cmid.classList.add("signal");

        if (sequence[i] == 1 && i !=0)
        {
            cmid.classList.add("on_left");
            ctop.classList.add("on_left");
            up = !up;
        }

        if (up) 
        {
            ctop.classList.add("on_top");
        }

        else
        {
            cmid.classList.add("on_bottom");
        }

        cbottom.innerHTML = sequence[i];
        cbottom.classList.add("binary_label");

        row_top.appendChild(ctop);
        row_mid.appendChild(cmid);
        row_bottom.appendChild(cbottom);
    }

    table.appendChild(row_top);
    table.appendChild(row_mid);
    table.appendChild(row_bottom);
}


// ami means alternate mark inversion
// 0 is always 0
// 1 alternates between - and +
function code_ami(sequence)
{
    const parent = "ami_container"
    const id = "ami_table";
    create_container(parent);
    create_label(parent, "AMI");
    create_new_table(id, parent);

    let table = document.getElementById(id);
    let row_top = document.createElement("tr");
    let row_mid = document.createElement("tr");
    let row_bottom = document.createElement("tr");

    let ctop = document.createElement("td");
    let cmid = document.createElement("td");
    let cbottom = document.createElement("td");

    cmid.innerHTML = "0";

    ctop.classList.add("level_label");
    cmid.classList.add("level_label");
    cbottom.classList.add("level_label");

    row_top.appendChild(ctop);
    row_mid.appendChild(cmid);
    row_bottom.appendChild(cbottom);

    let last = 0;
    let up = false;

    for (let i = 0; i < sequence.length; i++) 
    {
        let ctop = document.createElement("td")
        let cmid = document.createElement("td")
        let cbottom = document.createElement("td")

        ctop.classList.add("indicator");
        ctop.classList.add("zero");
        cmid.classList.add("indicator");

        ctop.classList.add("signal");
        cmid.classList.add("signal");

        if (sequence[i] == 0) 
        {
            ctop.classList.add("on_bottom");
            if (last == 1 && i != 0)
            {
                if (up) 
                    ctop.classList.add("on_left");   
                else
                    cmid.classList.add("on_left");   
            }
        }

        else
        {
            up = !up;

            if (up) 
            {
                if(last == 1 && i != 0)
                {
                    cmid.classList.add("on_left");    
                }

                if(i != 0)
                    ctop.classList.add("on_left");    
                ctop.classList.add("on_top");    
            }

            else
            {
                if(last == 1 && i != 0)
                {
                    ctop.classList.add("on_left");    
                }

                if(i != 0)
                    cmid.classList.add("on_left");    
                cmid.classList.add("on_bottom");  
            }
        }

        cbottom.innerHTML = sequence[i];
        cbottom.classList.add("binary_label");

        row_top.appendChild(ctop);
        row_mid.appendChild(cmid);
        row_bottom.appendChild(cbottom);

        last = sequence[i];
    }

    table.appendChild(row_top);
    table.appendChild(row_mid);
    table.appendChild(row_bottom);
}

// pseudoternary is similar to ami
// 1 is always 0
// 0 alternates between - and +
function code_pseudoternary(sequence)
{
    const parent = "pseudoternary_container"
    const id = "pseudoternary_table";
    create_container(parent);
    create_label(parent, "Pseudoternário");
    create_new_table(id, parent);

    let table = document.getElementById(id);
    let row_top = document.createElement("tr");
    let row_mid = document.createElement("tr");
    let row_bottom = document.createElement("tr");

    let ctop = document.createElement("td");
    let cmid = document.createElement("td");
    let cbottom = document.createElement("td");

    cmid.innerHTML = "0";

    ctop.classList.add("level_label");
    cmid.classList.add("level_label");
    cbottom.classList.add("level_label");

    row_top.appendChild(ctop);
    row_mid.appendChild(cmid);
    row_bottom.appendChild(cbottom);

    let last = 1;
    let up = false;

    for (let i = 0; i < sequence.length; i++) 
    {
        let ctop = document.createElement("td")
        let cmid = document.createElement("td")
        let cbottom = document.createElement("td")

        ctop.classList.add("indicator");
        ctop.classList.add("zero");
        cmid.classList.add("indicator");

        ctop.classList.add("signal");
        cmid.classList.add("signal");

        if (sequence[i] == 1) 
        {
            ctop.classList.add("on_bottom");
            if (last == 0 && i != 0)
            {
                if (up) 
                    ctop.classList.add("on_left");   
                else
                    cmid.classList.add("on_left");   
            }
        }

        else
        {
            up = !up;

            if (up) 
            {
                if(last == 0)
                {
                    cmid.classList.add("on_left");    
                }

                if(i != 0)
                    ctop.classList.add("on_left");    
                ctop.classList.add("on_top");    
            }

            else
            {
                if(last == 0)
                {
                    ctop.classList.add("on_left");    
                }

                if(i != 0)
                    cmid.classList.add("on_left");    
                cmid.classList.add("on_bottom");  
            }
        }

        cbottom.innerHTML = sequence[i];
        cbottom.classList.add("binary_label");

        row_top.appendChild(ctop);
        row_mid.appendChild(cmid);
        row_bottom.appendChild(cbottom);

        last = sequence[i];
    }

    table.appendChild(row_top);
    table.appendChild(row_mid);
    table.appendChild(row_bottom);
}

function code_manchester(sequence)
{
    const parent = "manchester_container"
    const id = "manchester_table";
    create_container(parent);
    create_label(parent, "Manchester");
    create_new_table(id, parent);

    let table = document.getElementById(id);
    let row_top = document.createElement("tr");
    let row_mid = document.createElement("tr");
    let row_bottom = document.createElement("tr");

    let ctop = document.createElement("td");
    let cmid = document.createElement("td");
    let cbottom = document.createElement("td");

    cmid.innerHTML = "0";

    ctop.classList.add("level_label");
    cmid.classList.add("level_label");
    cbottom.classList.add("level_label");

    row_top.appendChild(ctop);
    row_mid.appendChild(cmid);
    row_bottom.appendChild(cbottom);

    let last = (sequence[0] == 0) ? 1 : 0;

    for (let i = 0; i < sequence.length; i++) 
    {
        let ctopA = document.createElement("td")
        let ctopB = document.createElement("td")

        let cmidA = document.createElement("td")
        let cmidB = document.createElement("td")

        let cbottom = document.createElement("td")
        cbottom.colSpan = 2;

        ctopA.classList.add("indicator", "zero", "signal");
        cmidA.classList.add("indicator", "signal");
        ctopB.classList.add("indicator", "zero", "signal");
        cmidB.classList.add("indicator", "signal");
        
        if (last == sequence[i]) 
        {
            cmidA.classList.add("on_left");
            ctopA.classList.add("on_left");

            if (last == 1) 
            {
                cmidA.classList.add("on_bottom");    
            }

            else
            {
                ctopA.classList.add("on_top");
            }
        }

        else
        {
            if (last == 0) 
            {
                cmidA.classList.add("on_bottom");    
            }

            else
            {
                ctopA.classList.add("on_top");
            }
        }

        ctopB.classList.add("on_left");
        cmidB.classList.add("on_left");

        if (sequence[i] == 0)
        {
            cmidB.classList.add("on_bottom");    
        }

        else
        {
            ctopB.classList.add("on_top");    
        }

        cbottom.innerHTML = sequence[i];
        cbottom.classList.add("binary_label");

        row_top.appendChild(ctopA);
        row_top.appendChild(ctopB);

        row_mid.appendChild(cmidA);
        row_mid.appendChild(cmidB);

        row_bottom.appendChild(cbottom);

        last = sequence[i];
    }

    table.appendChild(row_top);
    table.appendChild(row_mid);
    table.appendChild(row_bottom);
}


function code_diff_manchester(sequence)
{
    const parent = "diff_manchester_container"
    const id = "diff_manchester_table";
    create_container(parent);
    create_label(parent, "Manchester Diferencial");
    create_new_table(id, parent);

    let table = document.getElementById(id);
    let row_top = document.createElement("tr");
    let row_mid = document.createElement("tr");
    let row_bottom = document.createElement("tr");

    let ctop = document.createElement("td");
    let cmid = document.createElement("td");
    let cbottom = document.createElement("td");

    cmid.innerHTML = "0";

    ctop.classList.add("level_label");
    cmid.classList.add("level_label");
    cbottom.classList.add("level_label");

    row_top.appendChild(ctop);
    row_mid.appendChild(cmid);
    row_bottom.appendChild(cbottom);

    let up = true;

    for (let i = 0; i < sequence.length; i++) 
    {
        let ctopA = document.createElement("td")
        let ctopB = document.createElement("td")

        let cmidA = document.createElement("td")
        let cmidB = document.createElement("td")

        let cbottom = document.createElement("td")
        cbottom.colSpan = 2;

        ctopA.classList.add("indicator", "zero", "signal");
        cmidA.classList.add("indicator", "signal");
        ctopB.classList.add("indicator", "zero", "signal");
        cmidB.classList.add("indicator", "signal");

        if(sequence[i] == 0)
        {
            ctopA.classList.add("on_left");
            cmidA.classList.add("on_left");
            up = !up;
        }

        if (up)
            ctopA.classList.add("on_top");
        else
            cmidA.classList.add("on_bottom");

        up = !up;
        ctopB.classList.add("on_left");
        cmidB.classList.add("on_left");

        if (up)
            ctopB.classList.add("on_top");
        else
            cmidB.classList.add("on_bottom");

        cbottom.innerHTML = sequence[i];
        cbottom.classList.add("binary_label");

        row_top.appendChild(ctopA);
        row_top.appendChild(ctopB);

        row_mid.appendChild(cmidA);
        row_mid.appendChild(cmidB);

        row_bottom.appendChild(cbottom);
    }

    table.appendChild(row_top);
    table.appendChild(row_mid);
    table.appendChild(row_bottom);
}

function encode_4b3t(sequence, dc)
{
    if (sequence == "0000")
    {
        if (dc == 1)
            return ["+0+", 2];

        else
            return ["0-0", -1];
    }

    else if(sequence == "0001")
    {
        return ["0-+", 0];
    }
    else if(sequence == "0010")
    {
        return ["+-0", 0];
    }
    else if(sequence == "0011")
    {
        if(dc == 4)
            return ["--0", -2];
        else
            return ["00+", 1];
    }
    else if(sequence == "0100")
    {
        return ["-+0", 0];
    }
    else if(sequence == "0101")
    {
        if(dc == 1)
            return ["0++", 2];
        else
            return ["-00", -1];
    }
    else if(sequence == "0110")
    {
        if(dc == 1 || dc == 2)
            return ["-++", 1];
        else
            return ["--+", -1];
    }
    else if(sequence == "0111")
    {
        return ["-0+", 0];
    }
    else if(sequence == "1000")
    {
        if(dc == 4)
            return ["0--", -2];
        else
            return ["+00", 1];
    }
    else if(sequence == "1001")
    {
        if(dc == 4)
            return ["---", -3];
        else
            return ["+-+", 1];
    }
    else if(sequence == "1010")
    {
        if(dc == 1 || dc == 2)
            return ["++-", 1];
        else
            return ["+--", -1];
    }
    else if(sequence == "1011")
    {
        return ["+0-", 0];
    }
    else if(sequence == "1100")
    {
        if(dc == 1)
            return ["+++", 3];
        else 
            return ["-+-", -1];
    }
    else if(sequence == "1101")
    {
        if(dc == 4)
            return ["-0-", -2];
        else
            return ["0+0", 1];
    }
    else if(sequence == "1110")
    {
        return ["0+-", 0];
    }
    else
    {
        if(dc == 1)
            return ["++0", 2];
        else
            return ["00-", -1];
    }

}

function code_4b3t(sequence)
{
    const parent = "code_4b3t_container"
    const id = "code_4b3t_table";
    create_container(parent);
    create_label(parent, "4B3T");

    if (sequence.length	% 4 != 0) 
    {
        let hr = document.createElement("hr");
        document.getElementById(parent).appendChild(hr);

        let error = document.createElement("p");
        error.innerHTML = "<span style='color:#20C20E'>-></span> Esse código de linha codifica de 4 em 4. Favor, insira uma sequência de bits de tamanho múltiplo de 4.";
        document.getElementById(parent).appendChild(error);

        return;
    }   

    create_new_table(id, parent);

    let table = document.getElementById(id);
    let row_top = document.createElement("tr");
    let row_mid = document.createElement("tr");
    let row_bottom = document.createElement("tr");

    let ctop = document.createElement("td");
    let cmid = document.createElement("td");
    let cbottom = document.createElement("td");

    cmid.innerHTML = "0";

    ctop.classList.add("level_label");
    cmid.classList.add("level_label");
    cbottom.classList.add("level_label");

    row_top.appendChild(ctop);
    row_mid.appendChild(cmid);
    row_bottom.appendChild(cbottom);

    let dc_offset = 1;

    encoding = encode_4b3t(sequence.slice(0, 4), dc_offset);
    levels = encoding[0];
    let last_level = levels[0];


    for (let i = 0; i < sequence.length; i+=4) 
    {
        encoding = encode_4b3t(sequence.slice(i, i+4), dc_offset);
        levels = encoding[0];
        dc_offset += encoding[1];

        for (let j = 0; j < 3; j++) 
        {
            let ctop = document.createElement("td")
            let cmid = document.createElement("td")

            ctop.classList.add("indicator");
            ctop.classList.add("zero");
            cmid.classList.add("indicator");

            ctop.classList.add("signal");
            cmid.classList.add("signal");

            if (levels[j] == 0)
            {
                ctop.classList.add("on_bottom");
                if (last_level == "+")
                    ctop.classList.add("on_left");
                else if(last_level == "-")
                    cmid.classList.add("on_left");
            }

            else if (levels[j] == "+")
            {
                ctop.classList.add("on_top");
                if (last_level == "0")
                    ctop.classList.add("on_left");
                else if(last_level == "-")
                {
                    ctop.classList.add("on_left");
                    cmid.classList.add("on_left");
                }
            }

            else
            {
                cmid.classList.add("on_bottom");
                if (last_level == "0")
                    cmid.classList.add("on_left");
                else if(last_level == "+")
                {
                    ctop.classList.add("on_left");
                    cmid.classList.add("on_left");
                }
            }

            row_top.appendChild(ctop);
            row_mid.appendChild(cmid);

            last_level = levels[j];
        }

        let cbottom = document.createElement("td")
        row_bottom.appendChild(cbottom);

        cbottom = document.createElement("td")
        cbottom.innerHTML = sequence.slice(i, i+4);
        cbottom.classList.add("binary_label");
        row_bottom.appendChild(cbottom);

        cbottom = document.createElement("td")
        row_bottom.appendChild(cbottom);
    }

    table.appendChild(row_top);
    table.appendChild(row_mid);
    table.appendChild(row_bottom);
}

function code_8b6t(sequence)
{
    const parent = "code_8b6t_container"
    const id = "code_8b6t_table";
    create_container(parent);
    create_label(parent, "8B6T");

    if (sequence.length	% 8 != 0) 
    {
        let hr = document.createElement("hr");
        document.getElementById(parent).appendChild(hr);

        let error = document.createElement("p");
        error.innerHTML = "<span style='color:#20C20E'>-></span> Esse código de linha codifica de 8 em 8. Favor, insira uma sequência de bits de tamanho múltiplo de 8.";
        document.getElementById(parent).appendChild(error);

        return;
    }   

    create_new_table(id, parent);

    let table = document.getElementById(id);
    let row_top = document.createElement("tr");
    let row_mid = document.createElement("tr");
    let row_bottom = document.createElement("tr");

    let ctop = document.createElement("td");
    let cmid = document.createElement("td");
    let cbottom = document.createElement("td");

    cmid.innerHTML = "0";

    ctop.classList.add("level_label");
    cmid.classList.add("level_label");
    cbottom.classList.add("level_label");

    row_top.appendChild(ctop);
    row_mid.appendChild(cmid);
    row_bottom.appendChild(cbottom);

    levels = table8b6t[sequence.slice(0, 8)];
    let last_level = levels[0];

    let line_weight = 0;

    for (let i = 0; i < sequence.length; i+=8) 
    {
        levels = table8b6t[sequence.slice(i, i+8)]

        signal_weight = levels.split("+").length - levels.split("-").length;

        if (line_weight == 1 && signal_weight == 1)
        {
            levels = levels.replace(/\+|-/g, v => v == "+" ? "-" : "+");
            signal_weight *= -1;
        }

        line_weight += signal_weight;

        for (let j = 0; j < 6; j++) 
        {
            let ctop = document.createElement("td")
            let cmid = document.createElement("td")

            ctop.classList.add("indicator");
            ctop.classList.add("zero");
            cmid.classList.add("indicator");

            ctop.classList.add("signal");
            cmid.classList.add("signal");

            if (levels[j] == 0)
            {
                ctop.classList.add("on_bottom");
                if (last_level == "+")
                    ctop.classList.add("on_left");
                else if(last_level == "-")
                    cmid.classList.add("on_left");
            }

            else if (levels[j] == "+")
            {
                ctop.classList.add("on_top");
                if (last_level == "0")
                    ctop.classList.add("on_left");
                else if(last_level == "-")
                {
                    ctop.classList.add("on_left");
                    cmid.classList.add("on_left");
                }
            }

            else
            {
                cmid.classList.add("on_bottom");
                if (last_level == "0")
                    cmid.classList.add("on_left");
                else if(last_level == "+")
                {
                    ctop.classList.add("on_left");
                    cmid.classList.add("on_left");
                }
            }

            row_top.appendChild(ctop);
            row_mid.appendChild(cmid);

            last_level = levels[j];
        }

        for (let k = 0; k < 3; k++) 
        {      
            let cbottom = document.createElement("td")
            row_bottom.appendChild(cbottom);        
        }

        cbottom = document.createElement("td");

        let p = document.createElement("p");
        p.classList.add("special_label");
        p.innerHTML = sequence.slice(i, i+8);

        cbottom.classList.add("binary_label");

        cbottom.appendChild(p);
        row_bottom.appendChild(cbottom);

        for (let k = 0; k < 2; k++) 
        {      
            let cbottom = document.createElement("td")
            row_bottom.appendChild(cbottom);        
        }
    }

    table.appendChild(row_top);
    table.appendChild(row_mid);
    table.appendChild(row_bottom);
}

function code_4dpam5(sequence)
{
    const parent = "code_4dpam5_container"

    create_container(parent);
    create_label(parent, "4D-PAM5");

    if (sequence.length	% 8 != 0) 
    {
        let hr = document.createElement("hr");
        document.getElementById(parent).appendChild(hr);

        let error = document.createElement("p");
        error.innerHTML = "<span style='color:#20C20E'>-></span> Esse código de linha codifica de 8 em 8. Favor, insira uma sequência de bits de tamanho múltiplo de 8.";
        document.getElementById(parent).appendChild(error);

        return;
    }   

    const CHANNEL_NAMES = ["A", "B", "C", "D"];

    function scramble(sequence)
    {
        let state = (BigInt(1) << BigInt(33)) - BigInt(1);
        let scrambled = "";

        for (const bit of sequence) {
            const msb = Number((state >> BigInt(32)) & BigInt(1));
            const tap = Number((state >> BigInt(12)) & BigInt(1));
            const newBit = msb ^ tap;
            const outBit = parseInt(bit, 10) ^ newBit;

            scrambled += outBit

            state = ((state << BigInt(1)) | BigInt(newBit)) & ((BigInt(1) << BigInt(33)) - BigInt(1));
        }

        return scrambled;
    }

    function encode(sequence) {
        let codes = [];

        for (let i = 0; i < sequence.length; i += 8) {
            const byte = sequence.slice(i, i + 8).split('').map(bit => parseInt(bit, 10));
            let parity = 0;

            for (const b of byte) {
                parity ^= b;
            }

            codes.push(byte.concat([parity]).join(''));
        }

        return codes;
    }

    function modulate(codes)
    {
        const signals = []

        for (const code of codes)
        {
            signals.push(tablepam5[code]);
        }

        return signals
    }

    const scrambled = scramble(sequence);
    const codes = encode(scrambled);
    const signals = modulate(codes);

    for (let channel = 0; channel < 4; channel++)
    {
        const id = `code_4dpam5_table_${channel}`;

        const label = document.createElement("p");
        label.innerHTML = `Canal ${CHANNEL_NAMES[channel]}`;
        label.classList.add("channel_label");

        document.getElementById(parent).appendChild(label);
        
        create_new_table(id, parent);

        let table = document.getElementById(id);
        let rows = [];

        for(let i = 0; i < 5; i++) {
            const row = document.createElement("tr");

            const crow = document.createElement("td");
            crow.classList.add("level_label");

            row.appendChild(crow);

            rows.push(row);
        }

        rows[0].children[0].innerHTML = "+2";
        rows[1].children[0].innerHTML = "+1";
        rows[2].children[0].innerHTML = "0";
        rows[3].children[0].innerHTML = "-1";
        rows[4].children[0].innerHTML = "-2";

        for (let i = 0; i < signals.length; i++)
        {
            let level = signals[i][channel];
            let prevLevel = i > 0 ? signals[i - 1][channel] : level;
            
            for(let r = 0; r < 4; r++) {
                let cell = document.createElement("td");
                cell.classList.add("indicator", "signal");

                if (r == 1)
                {
                    cell.classList.add("zero");
                }

                if (
                    (r === 0 && level === 2) || 
                    (r === 1 && level === 1) || 
                    (r === 2 && level === 0) || 
                    (r === 3 && level === -1)
                ) {
                    cell.classList.add("on_top");
                }
                if (r === 3 && level === -2) {
                    cell.classList.add("on_bottom");
                }

                if (i > 0 && prevLevel !== level) {
                    let fromRow = 2 - Math.sign(prevLevel) * Math.abs(Math.ceil(prevLevel/1));
                    let toRow = 2 - Math.sign(level) * Math.abs(Math.ceil(level/1));

                    let minRow = Math.min(fromRow, toRow);
                    let maxRow = Math.max(fromRow, toRow);

                    if ((level > prevLevel && r >= minRow && r < maxRow) ||
                        (level < prevLevel && r >= minRow && r < maxRow)) {
                        cell.classList.add("on_left");
                    }
                }

                rows[r].appendChild(cell);
            }

            let label = document.createElement("td");

            label.innerHTML = sequence.substring(8 * i, 8 * (i + 1))
            label.classList.add("binary_label");
            rows[4].appendChild(label);
        }

        rows.forEach(row => table.appendChild(row));
    }
}

function generate()
{
    let sequence = document.getElementById("sequence_in").value;
    document.getElementById("viewer_container").innerHTML = "";

    code_nrzl(sequence);
    code_nrzi(sequence);
    code_ami(sequence);
    code_pseudoternary(sequence);
    code_manchester(sequence);
    code_diff_manchester(sequence);
    code_4b3t(sequence);
    code_8b6t(sequence);
    code_4dpam5(sequence)
}

const table8b6t = {
    "00000000": "-+00-+",
    "00100000": "-++-00",
    "01000000": "-00+0+",
    "01100000": "0++0-0",
    "00000001": "0-+-+0",
    "00100001": "+00+--",
    "01000001": "0-00++",
    "01100001": "+0+-00",
    "00000010": "0-+0-+",
    "00100010": "-+0-++",
    "01000010": "0-0+0+",
    "01100010": "+0+0-0",
    "00000011": "0-++0-",
    "00100011": "+-0-++",
    "01000011": "0-0++0",
    "01100011": "+0+00-",
    "00000100": "-+0+0-",
    "00100100": "+-0+00",
    "01000100": "-00++0",
    "01100100": "0++00-",
    "00000101": "+0--+0",
    "00100101": "-+0+00",
    "01000101": "00-0++",
    "01100101": "++0-00",
    "00000110": "+0-0-+",
    "00100110": "+00-00",
    "01000110": "00-+0+",
    "01100110": "++00-0",
    "00000111": "+0-+0-",
    "00100111": "-+++--",
    "01000111": "00-++0",
    "01100111": "++000-",
    "00001000": "-+00+-",
    "00101000": "0++-0-",
    "01001000": "00+000",
    "01101000": "0++-+-",
    "00001001": "0-++-0",
    "00101001": "+0+0--",
    "01001001": "++-000",
    "01101001": "+0++--",
    "00001010": "0-+0+-",
    "00101010": "+0+-0-",
    "01001010": "+-+000",
    "01101010": "+0+-+-",
    "00001011": "0-+-0+",
    "00101011": "+0+--0",
    "01001011": "-++000",
    "01101011": "+0+--+",
    "00001100": "-+0-0+",
    "00101100": "0++--0",
    "01001100": "0+-000",
    "01101100": "0++--+",
    "00001101": "+0-+-0",
    "00101101": "++00--",
    "01001101": "+0-000",
    "01101101": "++0+--",
    "00001110": "+0-0+-",
    "00101110": "++0-0-",
    "01001110": "0-+000",
    "01101110": "++0-+-",
    "00001111": "+0--0+",
    "00101111": "++0--0",
    "01001111": "-0+000",
    "01101111": "++0--+",
    "00010000": "0--+0+",
    "00110000": "+-00-+",
    "01010000": "+--+0+",
    "01110000": "000++-",
    "00010001": "-0-0++",
    "00110001": "0+--+0",
    "01010001": "-+-0++",
    "01110001": "000+-+",
    "00010010": "-0-+0+",
    "00110010": "0+-0-+",
    "01010010": "-+-+0+",
    "01110010": "000-++",
    "00010011": "-0-++0",
    "00110011": "0+-+0-",
    "01010011": "-+-++0",
    "01110011": "000+00",
    "00010100": "0--++0",
    "00110100": "+-0+0-",
    "01010100": "+--++0",
    "01110100": "000+0-",
    "00010101": "--00++",
    "00110101": "-0+-+0",
    "01010101": "--+0++",
    "01110101": "000+-0",
    "00010110": "--0+0+",
    "00110110": "-0+0-+",
    "01010110": "--++0+",
    "01110110": "000-0+",
    "00010111": "--0++0",
    "00110111": "-0++0-",
    "01010111": "--+++0",
    "01110111": "000-+0",
    "00011000": "-+0-+0",
    "00111000": "+-00+-",
    "01011000": "--0+++",
    "01111000": "+++--0",
    "00011001": "+-0-+0",
    "00111001": "0+-+-0",
    "01011001": "-0-+++",
    "01111001": "+++-0-",
    "00011010": "-++-+0",
    "00111010": "0+-0+-",
    "01011010": "0--+++",
    "01111010": "+++0--",
    "00011011": "+00-+0",
    "00111011": "0+--0+",
    "01011011": "0--0++",
    "01111011": "0++0--",
    "00011100": "+00+-0",
    "00111100": "+-0-0+",
    "01011100": "+--0++",
    "01111100": "-00-++",
    "00011101": "-+++-0",
    "00111101": "-0++-0",
    "01011101": "-000++",
    "01111101": "-00+00",
    "00011110": "+-0+-0",
    "00111110": "-0+0+-",
    "01011110": "0+++--",
    "01111110": "+---++",
    "00011111": "-+0+-0",
    "00111111": "-0+-0+",
    "01011111": "0++-00",
    "01111111": "+--+00",
    "10000000": "-00+-+",
    "10100000": "-++0-0",
    "11000000": "-+0+-+",
    "11100000": "-++0-+",
    "10000001": "0-0-++",
    "10100001": "+-+-00",
    "11000001": "0-+-++",
    "11100001": "+-++0",
    "10000010": "0-0+-+",
    "10100010": "+-+0-0",
    "11000010": "0-++-+",
    "11100010": "+-+0-+",
    "10000011": "0-0++-",
    "10100011": "+-+00-",
    "11000011": "0-+++-",
    "11100011": "+-++0-",
    "10000100": "-00++-",
    "10100100": "-++00-",
    "11000100": "-+0++-",
    "11100100": "-+++0-",
    "10000101": "00--++",
    "10100101": "++--00",
    "11000101": "+0--++",
    "11100101": "++--+0",
    "10000110": "00-+-+",
    "10100110": "++-0-0",
    "11000110": "+0-+-+",
    "11100110": "++-0-+",
    "10000111": "00-++-",
    "10100111": "++-00-",
    "11000111": "+0-++-",
    "11100111": "++-+0-",
    "10001000": "-000+0",
    "10101000": "-++-+-",
    "11001000": "-+00+0",
    "11101000": "-++0+-",
    "10001001": "0-0+00",
    "10101001": "+-++--",
    "11001001": "0-++00",
    "11101001": "+-++-0",
    "10001010": "0-00+0",
    "10101010": "+-+-+-",
    "11001010": "0-+0+0",
    "11101010": "+-+0+-",
    "10001011": "0-000+",
    "10101011": "+-+--+",
    "11001011": "0-+00+",
    "11101011": "+-+-0+",
    "10001100": "-0000+",
    "10101100": "-++--+",
    "11001100": "-+000+",
    "11101100": "-++-0+",
    "10001101": "00-+00",
    "10101101": "++-+--",
    "11001101": "+0-+00",
    "11101101": "++-+-0",
    "10001110": "00-0+0",
    "10101110": "++--+-",
    "11001110": "+0-0+0",
    "11101110": "++-0+-",
    "10001111": "00-00+",
    "10101111": "++---+",
    "11001111": "+0-00+",
    "11101111": "++--0+",
    "10010000": "+--+-+",
    "10110000": "+000-0",
    "11010000": "+-0+-+",
    "11110000": "+000-+",
    "10010001": "-+--++",
    "10110001": "0+0-00",
    "11010001": "0+--++",
    "11110001": "0+0-+0",
    "10010010": "-+-+-+",
    "10110010": "0+00-0",
    "11010010": "0+-+-+",
    "11110010": "0+00-+",
    "10010011": "-+-++-",
    "10110011": "0+000-",
    "11010011": "0+-++-",
    "11110011": "0+0+0-",
    "10010100": "+--++-",
    "10110100": "+0000-",
    "11010100": "+-0++-",
    "11110100": "+00+0-",
    "10010101": "--+-++",
    "10110101": "00+-00",
    "11010101": "-0+-++",
    "11110101": "00+-+0",
    "10010110": "--++-+",
    "10110110": "00+0-0",
    "11010110": "-0++-+",
    "11110110": "00+0-+",
    "10010111": "--+++-",
    "10110111": "00+00-",
    "11010111": "-0+++-",
    "11110111": "00++0-",
    "10011000": "+--0+0",
    "10111000": "+00-+-",
    "11011000": "+-00+0",
    "11111000": "+000+-",
    "10011001": "-+-+00",
    "10111001": "0+0+--",
    "11011001": "0+-+00",
    "11111001": "0+0+-0",
    "10011010": "-+-0+0",
    "10111010": "0+0-+-",
    "11011010": "0+-0+0",
    "11111010": "0+00+-",
    "10011011": "-+-00+",
    "10111011": "0+0--+",
    "11011011": "0+-00+",
    "11111011": "0+0-0+",
    "10011100": "+--00+",
    "10111100": "+00--+",
    "11011100": "+-000+",
    "11111100": "+00-0+",
    "10011101": "--++00",
    "10111101": "00++--",
    "11011101": "-0++00",
    "11111101": "00++-0",
    "10011110": "--+0+0",
    "10111110": "00+-+-",
    "11011110": "-0+0+0",
    "11111110": "00+0+-",
    "10011111": "--+00+",
    "10111111": "00+--+",
    "11011111": "-0+00+",
    "11111111": "00+-0+"
};

const tablepam5 = {
    "000000000": [0, 0, 0, 0],
    "000000010": [0, 0, 1, 1],
    "000000100": [0, 1, 1, 0],
    "000000110": [0, 1, 0, 1],
    "000001000": [-2, 0, 0, 0],
    "000001010": [-2, 0, 1, 1],
    "000001100": [-2, 1, 1, 0],
    "000001110": [-2, 1, 0, 1],
    "000010000": [0, -2, 0, 0],
    "000010010": [0, -2, 1, 1],
    "000010100": [0, -1, 1, 0],
    "000010110": [0, -1, 0, 1],
    "000011000": [-2, -2, 0, 0],
    "000011010": [-2, -2, 1, 1],
    "000011100": [-2, -1, 1, 0],
    "000011110": [-2, -1, 0, 1],
    "000100000": [0, 0, -2, 0],
    "000100010": [0, 0, -1, 1],
    "000100100": [0, 1, -1, 0],
    "000100110": [0, 1, -2, 1],
    "000101000": [-2, 0, -2, 0],
    "000101010": [-2, 0, -1, 1],
    "000101100": [-2, 1, -1, 0],
    "000101110": [-2, 1, -2, 1],
    "000110000": [0, -2, -2, 0],
    "000110010": [0, -2, -1, 1],
    "000110100": [0, -1, -1, 0],
    "000110110": [0, -1, -2, 1],
    "000111000": [-2, -2, -2, 0],
    "000111010": [-2, -2, -1, 1],
    "000111100": [-2, -1, -1, 0],
    "000111110": [-2, -1, -2, 1],
    "001000000": [0, 0, 0, -2],
    "001000010": [0, 0, 1, -1],
    "001000100": [0, 1, 1, -2],
    "001000110": [0, 1, 0, -1],
    "001001000": [-2, 0, 0, -2],
    "001001010": [-2, 0, 1, -1],
    "001001100": [-2, 1, 1, -2],
    "001001110": [-2, 1, 0, -1],
    "001010000": [0, -2, 0, -2],
    "001010010": [0, -2, 1, -1],
    "001010100": [0, -1, 1, -2],
    "001010110": [0, -1, 0, -1],
    "001011000": [-2, -2, 0, -2],
    "001011010": [-2, -2, 1, -1],
    "001011100": [-2, -1, 1, -2],
    "001011110": [-2, -1, 0, -1],
    "001100000": [0, 0, -2, -2],
    "001100010": [0, 0, -1, -1],
    "001100100": [0, 1, -1, -2],
    "001100110": [0, 1, -2, -1],
    "001101000": [-2, 0, -2, -2],
    "001101010": [-2, 0, -1, -1],
    "001101100": [-2, 1, -1, -2],
    "001101110": [-2, 1, -2, -1],
    "001110000": [0, -2, -2, -2],
    "001110010": [0, -2, -1, -1],
    "001110100": [0, -1, -1, -2],
    "001110110": [0, -1, -2, -1],
    "001111000": [-2, -2, -2, -2],
    "001111010": [-2, -2, -1, -1],
    "001111100": [-2, -1, -1, -2],
    "001111110": [-2, -1, -2, -1],
    "010000000": [1, 1, 1, 1],
    "010000010": [1, 1, 0, 0],
    "010000100": [1, 0, 0, 1],
    "010000110": [1, 0, 1, 0],
    "010001000": [-1, 1, 1, 1],
    "010001010": [-1, 1, 0, 0],
    "010001100": [-1, 0, 0, 1],
    "010001110": [-1, 0, 1, 0],
    "010010000": [1, -1, 1, 1],
    "010010010": [1, -1, 0, 0],
    "010010100": [1, -2, 0, 1],
    "010010110": [1, -2, 1, 0],
    "010011000": [-1, -1, 1, 1],
    "010011010": [-1, -1, 0, 0],
    "010011100": [-1, -2, 0, 1],
    "010011110": [-1, -2, 1, 0],
    "010100000": [1, 1, -1, 1],
    "010100010": [1, 1, -2, 0],
    "010100100": [1, 0, -2, 1],
    "010100110": [1, 0, -1, 0],
    "010101000": [-1, 1, -1, 1],
    "010101010": [-1, 1, -2, 0],
    "010101100": [-1, 0, -2, 1],
    "010101110": [-1, 0, -1, 0],
    "010110000": [1, -1, -1, 1],
    "010110010": [1, -1, -2, 0],
    "010110100": [1, -2, -2, 1],
    "010110110": [1, -2, -1, 0],
    "010111000": [-1, -1, -1, 1],
    "010111010": [-1, -1, -2, 0],
    "010111100": [-1, -2, -2, 1],
    "010111110": [-1, -2, -1, 0],
    "011000000": [1, 1, 1, -1],
    "011000010": [1, 1, 0, -2],
    "011000100": [1, 0, 0, -1],
    "011000110": [1, 0, 1, -2],
    "011001000": [-1, 1, 1, -1],
    "011001010": [-1, 1, 0, -2],
    "011001100": [-1, 0, 0, -1],
    "011001110": [-1, 0, 1, -2],
    "011010000": [1, -1, 1, -1],
    "011010010": [1, -1, 0, -2],
    "011010100": [1, -2, 0, -1],
    "011010110": [1, -2, 1, -2],
    "011011000": [-1, -1, 1, -1],
    "011011010": [-1, -1, 0, -2],
    "011011100": [-1, -2, 0, -1],
    "011011110": [-1, -2, 1, -2],
    "011100000": [1, 1, -1, -1],
    "011100010": [1, 1, -2, -2],
    "011100100": [1, 0, -2, -1],
    "011100110": [1, 0, -1, -2],
    "011101000": [-1, 1, -1, -1],
    "011101010": [-1, 1, -2, -2],
    "011101100": [-1, 0, -2, -1],
    "011101110": [-1, 0, -1, -2],
    "011110000": [1, -1, -1, -1],
    "011110010": [1, -1, -2, -2],
    "011110100": [1, -2, -2, -1],
    "011110110": [1, -2, -1, -2],
    "011111000": [-1, -1, -1, -1],
    "011111010": [-1, -1, -2, -2],
    "011111100": [-1, -2, -2, -1],
    "011111110": [-1, -2, -1, -2],
    "100000000": [2, 0, 0, 0],
    "100000010": [2, 0, 1, 1],
    "100000100": [2, 1, 1, 0],
    "100000110": [2, 1, 0, 1],
    "100001000": [2, -2, 0, 0],
    "100001010": [2, -2, 1, 1],
    "100001100": [2, -1, 1, 0],
    "100001110": [2, -1, 0, 1],
    "100010000": [2, 0, -2, 0],
    "100010010": [2, 0, -1, 1],
    "100010100": [2, 1, -1, 0],
    "100010110": [2, 1, -2, 1],
    "100011000": [2, -2, -2, 0],
    "100011010": [2, -2, -1, 1],
    "100011100": [2, -1, -1, 0],
    "100011110": [2, -1, -2, 1],
    "100100000": [2, 0, 0, -2],
    "100100010": [2, 0, 1, -1],
    "100100100": [2, 1, 1, -2],
    "100100110": [2, 1, 0, -1],
    "100101000": [2, -2, 0, -2],
    "100101010": [2, -2, 1, -1],
    "100101100": [2, -1, 1, -2],
    "100101110": [2, -1, 0, -1],
    "100110000": [2, 0, -2, -2],
    "100110010": [2, 0, -1, -1],
    "100110100": [2, 1, -1, -2],
    "100110110": [2, 1, -2, -1],
    "100111000": [2, -2, -2, -2],
    "100111010": [2, -2, -1, -1],
    "100111100": [2, -1, -1, -2],
    "100111110": [2, -1, -2, -1],
    "101000000": [0, 0, 2, 0],
    "101000010": [1, 1, 2, 0],
    "101000100": [1, 0, 2, 1],
    "101000110": [0, 1, 2, 1],
    "101001000": [-2, 0, 2, 0],
    "101001010": [-1, 1, 2, 0],
    "101001100": [-1, 0, 2, 1],
    "101001110": [-2, 1, 2, 1],
    "101010000": [0, -2, 2, 0],
    "101010010": [1, -1, 2, 0],
    "101010100": [1, -2, 2, 1],
    "101010110": [0, -1, 2, 1],
    "101011000": [-2, -2, 2, 0],
    "101011010": [-1, -1, 2, 0],
    "101011100": [-1, -2, 2, 1],
    "101011110": [-2, -1, 2, 1],
    "101100000": [0, 0, 2, -2],
    "101100010": [1, 1, 2, -2],
    "101100100": [1, 0, 2, -1],
    "101100110": [0, 1, 2, -1],
    "101101000": [-2, 0, 2, -2],
    "101101010": [-1, 1, 2, -2],
    "101101100": [-1, 0, 2, -1],
    "101101110": [-2, 1, 2, -1],
    "101110000": [0, -2, 2, -2],
    "101110010": [1, -1, 2, -2],
    "101110100": [1, -2, 2, -1],
    "101110110": [0, -1, 2, -1],
    "101111000": [-2, -2, 2, -2],
    "101111010": [-1, -1, 2, -2],
    "101111100": [-1, -2, 2, -1],
    "101111110": [-2, -1, 2, -1],
    "110000000": [0, 2, 0, 0],
    "110000010": [0, 2, 1, 1],
    "110000100": [1, 2, 0, 1],
    "110000110": [1, 2, 1, 0],
    "110001000": [-2, 2, 0, 0],
    "110001010": [-2, 2, 1, 1],
    "110001100": [-1, 2, 0, 1],
    "110001110": [-1, 2, 1, 0],
    "110010000": [0, 2, -2, 0],
    "110010010": [0, 2, -1, 1],
    "110010100": [1, 2, -2, 1],
    "110010110": [1, 2, -1, 0],
    "110011000": [-2, 2, -2, 0],
    "110011010": [-2, 2, -1, 1],
    "110011100": [-1, 2, -2, 1],
    "110011110": [-1, 2, -1, 0],
    "110100000": [0, 2, 0, -2],
    "110100010": [0, 2, 1, -1],
    "110100100": [1, 2, 0, -1],
    "110100110": [1, 2, 1, -2],
    "110101000": [-2, 2, 0, -2],
    "110101010": [-2, 2, 1, -1],
    "110101100": [-1, 2, 0, -1],
    "110101110": [-1, 2, 1, -2],
    "110110000": [0, 2, -2, -2],
    "110110010": [0, 2, -1, -1],
    "110110100": [1, 2, -2, -1],
    "110110110": [1, 2, -1, -2],
    "110111000": [-2, 2, -2, -2],
    "110111010": [-2, 2, -1, -1],
    "110111100": [-1, 2, -2, -1],
    "110111110": [-1, 2, -1, -2],
    "111000000": [0, 0, 0, 2],
    "111000010": [1, 1, 0, 2],
    "111000100": [0, 1, 1, 2],
    "111000110": [1, 0, 1, 2],
    "111001000": [-2, 0, 0, 2],
    "111001010": [-1, 1, 0, 2],
    "111001100": [-2, 1, 1, 2],
    "111001110": [-1, 0, 1, 2],
    "111010000": [0, -2, 0, 2],
    "111010010": [1, -1, 0, 2],
    "111010100": [0, -1, 1, 2],
    "111010110": [1, -2, 1, 2],
    "111011000": [-2, -2, 0, 2],
    "111011010": [-1, -1, 0, 2],
    "111011100": [-2, -1, 1, 2],
    "111011110": [-1, -2, 1, 2],
    "111100000": [0, 0, -2, 2],
    "111100010": [1, 1, -2, 2],
    "111100100": [0, 1, -1, 2],
    "111100110": [1, 0, -1, 2],
    "111101000": [-2, 0, -2, 2],
    "111101010": [-1, 1, -2, 2],
    "111101100": [-2, 1, -1, 2],
    "111101110": [-1, 0, -1, 2],
    "111110000": [0, -2, -2, 2],
    "111110010": [1, -1, -2, 2],
    "111110100": [0, -1, -1, 2],
    "111110110": [1, -2, -1, 2],
    "111111000": [-2, -2, -2, 2],
    "111111010": [-1, -1, -2, 2],
    "111111100": [-2, -1, -1, 2],
    "111111110": [-1, -2, -1, 2],
    "000000001": [0, 0, 0, 1],
    "000000011": [0, 0, 1, 0],
    "000000101": [0, 1, 1, 1],
    "000000111": [0, 1, 0, 0],
    "000001001": [-2, 0, 0, 1],
    "000001011": [-2, 0, 1, 0],
    "000001101": [-2, 1, 1, 1],
    "000001111": [-2, 1, 0, 0],
    "000010001": [0, -2, 0, 1],
    "000010011": [0, -2, 1, 0],
    "000010101": [0, -1, 1, 1],
    "000010111": [0, -1, 0, 0],
    "000011001": [-2, -2, 0, 1],
    "000011011": [-2, -2, 1, 0],
    "000011101": [-2, -1, 1, 1],
    "000011111": [-2, -1, 0, 0],
    "000100001": [0, 0, -2, 1],
    "000100011": [0, 0, -1, 0],
    "000100101": [0, 1, -1, 1],
    "000100111": [0, 1, -2, 0],
    "000101001": [-2, 0, -2, 1],
    "000101011": [-2, 0, -1, 0],
    "000101101": [-2, 1, -1, 1],
    "000101111": [-2, 1, -2, 0],
    "000110001": [0, -2, -2, 1],
    "000110011": [0, -2, -1, 0],
    "000110101": [0, -1, -1, 1],
    "000110111": [0, -1, -2, 0],
    "000111001": [-2, -2, -2, 1],
    "000111011": [-2, -2, -1, 0],
    "000111101": [-2, -1, -1, 1],
    "000111111": [-2, -1, -2, 0],
    "001000001": [0, 0, 0, -1],
    "001000011": [0, 0, 1, -2],
    "001000101": [0, 1, 1, -1],
    "001000111": [0, 1, 0, -2],
    "001001001": [-2, 0, 0, -1],
    "001001011": [-2, 0, 1, -2],
    "001001101": [-2, 1, 1, -1],
    "001001111": [-2, 1, 0, -2],
    "001010001": [0, -2, 0, -1],
    "001010011": [0, -2, 1, -2],
    "001010101": [0, -1, 1, -1],
    "001010111": [0, -1, 0, -2],
    "001011001": [-2, -2, 0, -1],
    "001011011": [-2, -2, 1, -2],
    "001011101": [-2, -1, 1, -1],
    "001011111": [-2, -1, 0, -2],
    "001100001": [0, 0, -2, -1],
    "001100011": [0, 0, -1, -2],
    "001100101": [0, 1, -1, -1],
    "001100111": [0, 1, -2, -2],
    "001101001": [-2, 0, -2, -1],
    "001101011": [-2, 0, -1, -2],
    "001101101": [-2, 1, -1, -1],
    "001101111": [-2, 1, -2, -2],
    "001110001": [0, -2, -2, -1],
    "001110011": [0, -2, -1, -2],
    "001110101": [0, -1, -1, -1],
    "001110111": [0, -1, -2, -2],
    "001111001": [-2, -2, -2, -1],
    "001111011": [-2, -2, -1, -2],
    "001111101": [-2, -1, -1, -1],
    "001111111": [-2, -1, -2, -2],
    "010000001": [1, 1, 1, 0],
    "010000011": [1, 1, 0, 1],
    "010000101": [1, 0, 0, 0],
    "010000111": [1, 0, 1, 1],
    "010001001": [-1, 1, 1, 0],
    "010001011": [-1, 1, 0, 1],
    "010001101": [-1, 0, 0, 0],
    "010001111": [-1, 0, 1, 1],
    "010010001": [1, -1, 1, 0],
    "010010011": [1, -1, 0, 1],
    "010010101": [1, -2, 0, 0],
    "010010111": [1, -2, 1, 1],
    "010011001": [-1, -1, 1, 0],
    "010011011": [-1, -1, 0, 1],
    "010011101": [-1, -2, 0, 0],
    "010011111": [-1, -2, 1, 1],
    "010100001": [1, 1, -1, 0],
    "010100011": [1, 1, -2, 1],
    "010100101": [1, 0, -2, 0],
    "010100111": [1, 0, -1, 1],
    "010101001": [-1, 1, -1, 0],
    "010101011": [-1, 1, -2, 1],
    "010101101": [-1, 0, -2, 0],
    "010101111": [-1, 0, -1, 1],
    "010110001": [1, -1, -1, 0],
    "010110011": [1, -1, -2, 1],
    "010110101": [1, -2, -2, 0],
    "010110111": [1, -2, -1, 1],
    "010111001": [-1, -1, -1, 0],
    "010111011": [-1, -1, -2, 1],
    "010111101": [-1, -2, -2, 0],
    "010111111": [-1, -2, -1, 1],
    "011000001": [1, 1, 1, -2],
    "011000011": [1, 1, 0, -1],
    "011000101": [1, 0, 0, -2],
    "011000111": [1, 0, 1, -1],
    "011001001": [-1, 1, 1, -2],
    "011001011": [-1, 1, 0, -1],
    "011001101": [-1, 0, 0, -2],
    "011001111": [-1, 0, 1, -1],
    "011010001": [1, -1, 1, -2],
    "011010011": [1, -1, 0, -1],
    "011010101": [1, -2, 0, -2],
    "011010111": [1, -2, 1, -1],
    "011011001": [-1, -1, 1, -2],
    "011011011": [-1, -1, 0, -1],
    "011011101": [-1, -2, 0, -2],
    "011011111": [-1, -2, 1, -1],
    "011100001": [1, 1, -1, -2],
    "011100011": [1, 1, -2, -1],
    "011100101": [1, 0, -2, -2],
    "011100111": [1, 0, -1, -1],
    "011101001": [-1, 1, -1, -2],
    "011101011": [-1, 1, -2, -1],
    "011101101": [-1, 0, -2, -2],
    "011101111": [-1, 0, -1, -1],
    "011110001": [1, -1, -1, -2],
    "011110011": [1, -1, -2, -1],
    "011110101": [1, -2, -2, -2],
    "011110111": [1, -2, -1, -1],
    "011111001": [-1, -1, -1, -2],
    "011111011": [-1, -1, -2, -1],
    "011111101": [-1, -2, -2, -2],
    "011111111": [-1, -2, -1, -1],
    "100000001": [2, 0, 0, 1],
    "100000011": [2, 0, 1, 0],
    "100000101": [2, 1, 1, 1],
    "100000111": [2, 1, 0, 0],
    "100001001": [2, -2, 0, 1],
    "100001011": [2, -2, 1, 0],
    "100001101": [2, -1, 1, 1],
    "100001111": [2, -1, 0, 0],
    "100010001": [2, 0, -2, 1],
    "100010011": [2, 0, -1, 0],
    "100010101": [2, 1, -1, 1],
    "100010111": [2, 1, -2, 0],
    "100011001": [2, -2, -2, 1],
    "100011011": [2, -2, -1, 0],
    "100011101": [2, -1, -1, 1],
    "100011111": [2, -1, -2, 0],
    "100100001": [2, 0, 0, -1],
    "100100011": [2, 0, 1, -2],
    "100100101": [2, 1, 1, -1],
    "100100111": [2, 1, 0, -2],
    "100101001": [2, -2, 0, -1],
    "100101011": [2, -2, 1, -2],
    "100101101": [2, -1, 1, -1],
    "100101111": [2, -1, 0, -2],
    "100110001": [2, 0, -2, -1],
    "100110011": [2, 0, -1, -2],
    "100110101": [2, 1, -1, -1],
    "100110111": [2, 1, -2, -2],
    "100111001": [2, -2, -2, -1],
    "100111011": [2, -2, -1, -2],
    "100111101": [2, -1, -1, -1],
    "100111111": [2, -1, -2, -2],
    "101000001": [0, 0, 2, 1],
    "101000011": [1, 1, 2, 1],
    "101000101": [1, 0, 2, 0],
    "101000111": [0, 1, 2, 0],
    "101001001": [-2, 0, 2, 1],
    "101001011": [-1, 1, 2, 1],
    "101001101": [-1, 0, 2, 0],
    "101001111": [-2, 1, 2, 0],
    "101010001": [0, -2, 2, 1],
    "101010011": [1, -1, 2, 1],
    "101010101": [1, -2, 2, 0],
    "101010111": [0, -1, 2, 0],
    "101011001": [-2, -2, 2, 1],
    "101011011": [-1, -1, 2, 1],
    "101011101": [-1, -2, 2, 0],
    "101011111": [-2, -1, 2, 0],
    "101100001": [0, 0, 2, -1],
    "101100011": [1, 1, 2, -1],
    "101100101": [1, 0, 2, -2],
    "101100111": [0, 1, 2, -2],
    "101101001": [-2, 0, 2, -1],
    "101101011": [-1, 1, 2, -1],
    "101101101": [-1, 0, 2, -2],
    "101101111": [-2, 1, 2, -2],
    "101110001": [0, -2, 2, -1],
    "101110011": [1, -1, 2, -1],
    "101110101": [1, -2, 2, -2],
    "101110111": [0, -1, 2, -2],
    "101111001": [-2, -2, 2, -1],
    "101111011": [-1, -1, 2, -1],
    "101111101": [-1, -2, 2, -2],
    "101111111": [-2, -1, 2, -2],
    "110000001": [0, 2, 0, 1],
    "110000011": [0, 2, 1, 0],
    "110000101": [1, 2, 0, 0],
    "110000111": [1, 2, 1, 1],
    "110001001": [-2, 2, 0, 1],
    "110001011": [-2, 2, 1, 0],
    "110001101": [-1, 2, 0, 0],
    "110001111": [-1, 2, 1, 1],
    "110010001": [0, 2, -2, 1],
    "110010011": [0, 2, -1, 0],
    "110010101": [1, 2, -2, 0],
    "110010111": [1, 2, -1, 1],
    "110011001": [-2, 2, -2, 1],
    "110011011": [-2, 2, -1, 0],
    "110011101": [-1, 2, -2, 0],
    "110011111": [-1, 2, -1, 1],
    "110100001": [0, 2, 0, -1],
    "110100011": [0, 2, 1, -2],
    "110100101": [1, 2, 0, -2],
    "110100111": [1, 2, 1, -1],
    "110101001": [-2, 2, 0, -1],
    "110101011": [-2, 2, 1, -2],
    "110101101": [-1, 2, 0, -2],
    "110101111": [-1, 2, 1, -1],
    "110110001": [0, 2, -2, -1],
    "110110011": [0, 2, -1, -2],
    "110110101": [1, 2, -2, -2],
    "110110111": [1, 2, -1, -1],
    "110111001": [-2, 2, -2, -1],
    "110111011": [-2, 2, -1, -2],
    "110111101": [-1, 2, -2, -2],
    "110111111": [-1, 2, -1, -1],
    "111000001": [1, 1, 1, 2],
    "111000011": [0, 0, 1, 2],
    "111000101": [1, 0, 0, 2],
    "111000111": [0, 1, 0, 2],
    "111001001": [-1, 1, 1, 2],
    "111001011": [-2, 0, 1, 2],
    "111001101": [-1, 0, 0, 2],
    "111001111": [-2, 1, 0, 2],
    "111010001": [1, -1, 1, 2],
    "111010011": [0, -2, 1, 2],
    "111010101": [1, -2, 0, 2],
    "111010111": [0, -1, 0, 2],
    "111011001": [-1, -1, 1, 2],
    "111011011": [-2, -2, 1, 2],
    "111011101": [-1, -2, 0, 2],
    "111011111": [-2, -1, 0, 2],
    "111100001": [1, 1, -1, 2],
    "111100011": [0, 0, -1, 2],
    "111100101": [1, 0, -2, 2],
    "111100111": [0, 1, -2, 2],
    "111101001": [-1, 1, -1, 2],
    "111101011": [-2, 0, -1, 2],
    "111101101": [-1, 0, -2, 2],
    "111101111": [-2, 1, -2, 2],
    "111110001": [1, -1, -1, 2],
    "111110011": [0, -2, -1, 2],
    "111110101": [1, -2, -2, 2],
    "111110111": [0, -1, -2, 2],
    "111111001": [-1, -1, -1, 2],
    "111111011": [-2, -2, -1, 2],
    "111111101": [-1, -2, -2, 2],
    "111111111": [-2, -1, -2, 2],
}
  
  