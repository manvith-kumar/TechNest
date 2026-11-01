#!/usr/bin/env python3
"""Generates migrations/V2__seed_data.sql (SAMPLE DATA ONLY - prices are illustrative, not official retail prices).
Usage: pip install bcrypt && python3 database/tools/generate_seed.py"""
import random, hashlib, datetime as dt, bcrypt, pathlib

random.seed(20261031)
NOW = dt.datetime(2026, 10, 31, 12, 0, 0)
OUT = pathlib.Path(__file__).resolve().parent.parent / "migrations" / "V2__seed_data.sql"
ADMIN_PW, CUSTOMER_PW = "Admin@12345", "Customer@12345"

def q(v):
    if v is None: return "NULL"
    if isinstance(v, bool): return "1" if v else "0"
    if isinstance(v, (int, float)): return str(v)
    if isinstance(v, dt.datetime): return "'" + v.strftime("%Y-%m-%d %H:%M:%S") + "'"
    return "'" + str(v).replace("\\", "\\\\").replace("'", "''") + "'"
def ins(table, cols, rows):
    if not rows: return ""
    out = f"INSERT INTO {table} ({', '.join(cols)}) VALUES\n"
    out += ",\n".join("(" + ", ".join(q(c) for c in r) + ")" for r in rows) + ";\n\n"
    return out
def slug(s): 
    import re; return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
def img(i): return f"https://images.unsplash.com/photo-{i}?auto=format&fit=crop&w=900&q=80"

def hashpw(p): return bcrypt.hashpw(p.encode(), bcrypt.gensalt(10)).decode()
admin_hash, cust_hash = hashpw(ADMIN_PW), hashpw(CUSTOMER_PW)

POOLS = {
 1: ["1511707171634-5f897ff02aa9","1592750475338-74b7b21085ab","1610945415295-d9bbf067e59c","1598327105666-5b89351aff97","1565849904461-04a58ad377e0"],
 2: ["1517336714731-489689fd1ca8","1496181133206-80ce9b88a853","1525547719571-a2d4ac8945e2","1593642632823-8f785ba67e45","1588872657578-7efd1f1555ed","1603302576837-37561b2e2302"],
 3: ["1544244015-0df4b3ffc6b0","1561154464-82e9adf32764","1585790050230-5dd28404ccb9","1542751110-97427bbecf20"],
 4: ["1505740420928-5e560c06d30e","1583394838336-acd977736f90","1546435770-a3e426bf472b","1484704849700-f032a568e944","1590658268037-6bf12165a8df","1608043152269-423dbba4e7e1","1608156639585-b3a032ef9689"],
 5: ["1523275335684-37898b6baf30","1546868871-7041f2a55e12","1579586337278-3befd40fd17a","1508685096489-7aacd43bd3b1"],
 6: ["1606144042614-b2417e99c4e3","1593305841991-05c297ba4575","1612198188060-c7c2a3b66eae","1527864550417-7fd91fc51a46","1511467687858-23d96c32e4ae"],
 7: ["1527864550417-7fd91fc51a46","1587829741301-dc798b83add3","1625948515291-69613efd103f","1609091839311-d5365f9ff1c5","1583863788434-e58a36330cf0"],
 8: ["1527443224154-c4a3942d3acf","1593359677879-a4bb92f829d1","1547119957-637f8679db1e"],
}
CATEGORIES = [
 (1,"Smartphones","Flagship and value smartphones with powerful cameras and all-day batteries."),
 (2,"Laptops","Ultrabooks, workstations and gaming laptops for work, study and play."),
 (3,"Tablets","Slim tablets for reading, sketching, streaming and note-taking."),
 (4,"Audio","Headphones, earbuds and portable speakers with rich, clear sound."),
 (5,"Wearables","Smartwatches that track fitness, sleep and notifications."),
 (6,"Gaming","Consoles, controllers and gear built for competitive play."),
 (7,"Accessories","Mice, keyboards, chargers and power banks for everyday setups."),
 (8,"Monitors","Colour-accurate and high-refresh displays for desks of every size."),
]
# (cat, brand, name, price, discount, final_stock, featured, blurb, specs "k:v|k:v")
P = [
 (1,"Apple","Apple iPhone 15 (128GB)",79900,74900,42,1,"Dynamic Island, a 48MP main camera and USB-C in a lightweight aluminium body.","Display:6.1-inch Super Retina XDR OLED|Chip:A16 Bionic|Rear camera:48MP main + 12MP ultra wide|Storage:128 GB|Battery:Up to 20 hours video playback|OS:iOS 17"),
 (1,"Apple","Apple iPhone 15 Pro (256GB)",134900,129900,18,1,"Titanium design with the A17 Pro chip, an Action button and a pro-grade camera system.","Display:6.1-inch Super Retina XDR ProMotion 120Hz|Chip:A17 Pro|Rear camera:48MP main + 12MP ultra wide + 12MP 3x telephoto|Storage:256 GB|Battery:Up to 23 hours video playback|OS:iOS 17"),
 (1,"Samsung","Samsung Galaxy S24 (256GB)",79999,69999,35,1,"Compact flagship with Galaxy AI features and a bright 120Hz AMOLED display.","Display:6.2-inch Dynamic AMOLED 2X 120Hz|Processor:Exynos 2400|Rear camera:50MP + 12MP + 10MP|Storage:256 GB|Battery:4000 mAh, 25W charging|OS:Android 14, One UI 6.1"),
 (1,"Samsung","Samsung Galaxy S24 Ultra (512GB)",139999,124999,9,1,"Titanium frame, built-in S Pen and a 200MP camera for serious photography.","Display:6.8-inch Dynamic AMOLED 2X 120Hz|Processor:Snapdragon 8 Gen 3 for Galaxy|Rear camera:200MP + 50MP + 12MP + 10MP|Storage:512 GB|Battery:5000 mAh, 45W charging|OS:Android 14, One UI 6.1"),
 (1,"OnePlus","OnePlus 12 (256GB)",64999,61999,27,0,"Snapdragon 8 Gen 3 performance with a Hasselblad-tuned camera and 100W charging.","Display:6.82-inch LTPO AMOLED 120Hz|Processor:Snapdragon 8 Gen 3|Rear camera:50MP + 48MP + 64MP|Storage:256 GB|Battery:5400 mAh, 100W wired charging|OS:OxygenOS 14"),
 (1,"OnePlus","OnePlus Nord CE 4 (128GB)",24999,22999,64,0,"A smooth 120Hz AMOLED display and 100W charging at a friendly price.","Display:6.7-inch AMOLED 120Hz|Processor:Snapdragon 7 Gen 3|Rear camera:50MP + 8MP|Storage:128 GB|Battery:5500 mAh, 100W charging|OS:OxygenOS 14"),
 (2,"Apple","Apple MacBook Air 13-inch (M2, 256GB)",114900,99900,21,1,"Fanless, 11.3mm thin and fast enough for everything from spreadsheets to video edits.","Display:13.6-inch Liquid Retina|Chip:Apple M2 (8-core CPU)|Memory:8 GB unified|Storage:256 GB SSD|Battery:Up to 18 hours|Weight:1.24 kg"),
 (2,"Apple","Apple MacBook Pro 14-inch (M3 Pro, 512GB)",199900,189900,7,1,"A Liquid Retina XDR display and the M3 Pro chip for demanding creative work.","Display:14.2-inch Liquid Retina XDR 120Hz|Chip:Apple M3 Pro (11-core CPU)|Memory:18 GB unified|Storage:512 GB SSD|Battery:Up to 18 hours|Weight:1.61 kg"),
 (2,"Dell","Dell XPS 13 (Core Ultra 7, 1TB)",149990,134990,12,0,"An edge-to-edge InfinityEdge display in a compact, machined aluminium chassis.","Display:13.4-inch FHD+ InfinityEdge|Processor:Intel Core Ultra 7|Memory:16 GB LPDDR5X|Storage:1 TB SSD|Battery:Up to 14 hours|Weight:1.19 kg"),
 (2,"HP","HP Pavilion 15 (Ryzen 5, 512GB)",62990,54990,38,0,"A dependable everyday laptop with a roomy display and quick SSD storage.","Display:15.6-inch FHD IPS anti-glare|Processor:AMD Ryzen 5 7530U|Memory:16 GB DDR4|Storage:512 GB SSD|Battery:Up to 9 hours|Weight:1.75 kg"),
 (2,"Lenovo","Lenovo ThinkPad E14 Gen 5 (Core i5)",72990,65990,24,0,"Business-ready build with the classic ThinkPad keyboard and security features.","Display:14-inch FHD IPS|Processor:Intel Core i5-1335U|Memory:16 GB DDR4|Storage:512 GB SSD|Battery:Up to 12 hours|Weight:1.41 kg"),
 (2,"ASUS","ASUS ROG Strix G16 (RTX 4060)",149990,134990,3,1,"A 165Hz QHD display and RTX 4060 graphics for high-frame-rate gaming.","Display:16-inch QHD+ 165Hz|Processor:Intel Core i7-13650HX|Graphics:NVIDIA GeForce RTX 4060 8GB|Memory:16 GB DDR5|Storage:1 TB SSD|Weight:2.5 kg"),
 (3,"Apple","Apple iPad (10th generation, 64GB)",39900,34900,45,1,"A colourful all-screen design with a 10.9-inch Liquid Retina display.","Display:10.9-inch Liquid Retina|Chip:A14 Bionic|Storage:64 GB|Rear camera:12MP|Connectivity:Wi-Fi 6|Weight:477 g"),
 (3,"Apple","Apple iPad Pro 11-inch (M4, 256GB)",99900,94900,10,0,"An ultra-thin Tandem OLED display with desktop-class M4 performance.","Display:11-inch Ultra Retina XDR OLED|Chip:Apple M4|Storage:256 GB|Rear camera:12MP|Connectivity:Wi-Fi 6E|Weight:444 g"),
 (3,"Samsung","Samsung Galaxy Tab S9 FE (128GB)",36999,31999,29,0,"IP68 water resistance and an included S Pen at a mid-range price.","Display:10.9-inch TFT 90Hz|Processor:Exynos 1380|Storage:128 GB|Battery:8000 mAh|Connectivity:Wi-Fi 6|Weight:523 g"),
 (3,"Lenovo","Lenovo Tab P12 (128GB)",29999,24999,0,0,"A 12.7-inch 3K display that suits reading, video and light multitasking.","Display:12.7-inch 3K IPS 90Hz|Processor:Dimensity 7050|Storage:128 GB|Battery:10200 mAh|Connectivity:Wi-Fi 6|Weight:615 g"),
 (4,"Sony","Sony WH-1000XM5 Wireless Headphones",34990,26990,31,1,"Industry-leading noise cancelling with 30 hours of battery life.","Type:Over-ear, wireless|Noise cancelling:Yes, 8 microphones|Battery:Up to 30 hours|Charging:USB-C, 3 min gives 3 hours|Connectivity:Bluetooth 5.2, multipoint|Weight:250 g"),
 (4,"Sony","Sony WF-1000XM5 Earbuds",24990,21990,26,0,"The smallest Sony noise-cancelling earbuds yet, with high-resolution audio support.","Type:In-ear, true wireless|Noise cancelling:Yes|Battery:Up to 8 hours (24 with case)|Water resistance:IPX4|Connectivity:Bluetooth 5.3|Weight:5.9 g per earbud"),
 (4,"JBL","JBL Flip 6 Portable Speaker",11999,9499,58,1,"Bold JBL Original Pro Sound in a rugged, waterproof portable body.","Type:Portable Bluetooth speaker|Battery:Up to 12 hours|Water resistance:IP67|Connectivity:Bluetooth 5.1, PartyBoost|Output power:30 W|Weight:550 g"),
 (4,"JBL","JBL Tune 770NC Headphones",8999,5999,73,0,"Adaptive noise cancelling and up to 70 hours of battery in a foldable design.","Type:Over-ear, wireless|Noise cancelling:Adaptive|Battery:Up to 70 hours (ANC off)|Charging:USB-C|Connectivity:Bluetooth 5.3|Weight:220 g"),
 (4,"Apple","Apple AirPods Pro (2nd generation, USB-C)",26900,24900,40,1,"Active Noise Cancellation, Adaptive Transparency and a MagSafe case with USB-C.","Type:In-ear, true wireless|Noise cancelling:Yes|Chip:Apple H2|Battery:Up to 6 hours (30 with case)|Water resistance:IP54|Connectivity:Bluetooth 5.3"),
 (4,"Samsung","Samsung Galaxy Buds2 Pro",17999,10999,4,0,"24-bit Hi-Fi audio and intelligent ANC in a comfortable ergonomic fit.","Type:In-ear, true wireless|Noise cancelling:Yes|Battery:Up to 5 hours (18 with case)|Water resistance:IPX7|Connectivity:Bluetooth 5.3|Weight:5.5 g per earbud"),
 (5,"Apple","Apple Watch Series 9 (GPS, 45mm)",44900,41900,19,1,"A brighter display and the S9 chip with a new double-tap gesture.","Display:Always-On Retina LTPO OLED|Chip:S9 SiP|Sensors:ECG, blood oxygen, temperature|Water resistance:50 metres|Battery:Up to 18 hours|Connectivity:GPS, Bluetooth 5.3"),
 (5,"Samsung","Samsung Galaxy Watch6 (44mm)",32999,24999,22,0,"A larger display, advanced sleep coaching and body composition analysis.","Display:1.5-inch Super AMOLED|Processor:Exynos W930|Sensors:ECG, BIA, heart rate, SpO2|Water resistance:5ATM + IP68|Battery:Up to 40 hours|OS:Wear OS 4"),
 (5,"OnePlus","OnePlus Watch 2",24999,20999,16,0,"Dual-engine architecture delivers up to 100 hours of battery life.","Display:1.43-inch AMOLED|Processor:Snapdragon W5 + BES2700|Sensors:Heart rate, SpO2, GPS (dual-band)|Water resistance:5ATM + IP68|Battery:Up to 100 hours|OS:Wear OS 4"),
 (6,"Sony","Sony PlayStation 5 Slim (Disc Edition)",54990,52990,11,1,"Ultra-high-speed SSD, ray tracing and 4K gaming at up to 120fps.","Storage:1 TB SSD|Resolution:Up to 4K at 120fps|Optical drive:Ultra HD Blu-ray|Controller:DualSense wireless|Connectivity:Wi-Fi 6, Bluetooth 5.1|Weight:3.2 kg"),
 (6,"Sony","Sony DualSense Wireless Controller",6990,5490,52,0,"Haptic feedback and adaptive triggers for deeper immersion.","Compatibility:PS5, PC, mobile|Feedback:Haptic + adaptive triggers|Battery:Up to 12 hours|Connectivity:Bluetooth 5.1, USB-C|Extras:Built-in microphone, motion sensors|Weight:280 g"),
 (6,"Logitech","Logitech G502 X Wired Gaming Mouse",6995,4495,60,0,"Hybrid optical-mechanical switches and a 25,600 DPI HERO sensor.","Sensor:HERO 25K, up to 25,600 DPI|Buttons:13 programmable|Connectivity:Wired USB|Switches:LIGHTFORCE hybrid|Weight:89 g|Lighting:LIGHTSYNC RGB"),
 (6,"Logitech","Logitech G915 TKL Wireless Keyboard",17995,13995,14,0,"Low-profile mechanical keys, LIGHTSPEED wireless and tenkeyless layout.","Layout:Tenkeyless|Switches:GL Tactile low-profile|Connectivity:LIGHTSPEED wireless, Bluetooth|Battery:Up to 40 hours with lighting|Lighting:Per-key RGB|Body:Aluminium alloy"),
 (6,"ASUS","ASUS ROG Delta S Gaming Headset",17990,14990,17,0,"Hi-Res ESS Quad-DAC and AI noise-cancelling microphone in a USB-C headset.","Type:Over-ear, wired USB-C|Drivers:50 mm|Microphone:AI noise-cancelling, boom|Audio:Hi-Res ESS 9281 Quad DAC|Compatibility:PC, PS5, Switch, mobile|Weight:300 g"),
 (7,"Logitech","Logitech MX Master 3S Wireless Mouse",10995,8995,48,1,"A quiet-click, 8,000 DPI mouse with a MagSpeed electromagnetic scroll wheel.","Sensor:Darkfield 8,000 DPI|Buttons:7|Connectivity:Bluetooth, Logi Bolt|Battery:Up to 70 days|Compatibility:Windows, macOS, Linux|Weight:141 g"),
 (7,"Logitech","Logitech MX Keys S Wireless Keyboard",12995,9995,33,0,"Smart illumination and shortcuts built around comfortable, spherically dished keys.","Layout:Full size|Connectivity:Bluetooth, Logi Bolt|Battery:Up to 10 days (5 months without backlight)|Backlight:Smart, adaptive|Compatibility:Windows, macOS, Linux|Weight:810 g"),
 (7,"Samsung","Samsung 45W Super Fast USB-C Charger",3499,1999,120,0,"Charge compatible Galaxy devices at up to 45W from a compact adapter.","Output:45 W PD 3.0 PPS|Port:1 x USB-C|Input:100-240 V|Cable:Not included|Protection:Over-voltage and temperature|Weight:92 g"),
 (7,"Samsung","Samsung 10000mAh Battery Pack (25W)",3999,2799,5,0,"Slim 10,000 mAh power bank with 25W super fast charging.","Capacity:10,000 mAh|Output:25 W USB-C PD|Ports:USB-C|Charging time:Approx. 3 hours|Protection:Multi-layer safety|Weight:230 g"),
 (7,"Apple","Apple MagSafe Charger (1m)",4500,4500 - 500,64,0,"Snaps on magnetically for faster, more reliable wireless charging.","Output:Up to 15 W|Compatibility:iPhone 12 and later, AirPods|Connector:USB-C|Cable length:1 m|Adapter:Not included|Standard:Qi2"),
 (8,"Dell","Dell UltraSharp U2723QE 27-inch 4K",62990,54990,8,1,"IPS Black panel, 4K resolution and a USB-C hub with 90W power delivery.","Size:27-inch|Resolution:3840 x 2160 (4K)|Panel:IPS Black, 60Hz|Colour:98% DCI-P3|Ports:USB-C 90W, HDMI, DisplayPort, RJ45|Stand:Height, tilt, swivel, pivot"),
 (8,"Dell","Dell S2421HN 24-inch Full HD",14999,10999,56,0,"A slim-bezel IPS monitor with AMD FreeSync for everyday use.","Size:23.8-inch|Resolution:1920 x 1080|Panel:IPS, 75Hz|Response time:4 ms|Ports:2 x HDMI|Stand:Tilt"),
 (8,"ASUS","ASUS ProArt PA278CV 27-inch QHD",36990,29990,13,0,"Factory-calibrated, Calman Verified colour for photo and video editing.","Size:27-inch|Resolution:2560 x 1440 (QHD)|Panel:IPS, 75Hz|Colour:100% sRGB, Delta E < 2|Ports:HDMI, DisplayPort, USB-C 65W|Stand:Height, tilt, swivel, pivot"),
]
EXTRA = {1:"Sample listing for demonstration.",2:"Sample listing for demonstration.",3:"Sample listing for demonstration."}

out = ["-- SAMPLE DATA ONLY. Generated by database/tools/generate_seed.py. Prices are illustrative, not official retail prices.",
       "-- Development credentials: admin@technest.dev / " + ADMIN_PW + " ; customer@technest.dev / " + CUSTOMER_PW + " (never use in production).",
       "SET NAMES utf8mb4;\n"]

# users
users = [(1,"TechNest Admin","admin@technest.dev",admin_hash,"+91 90000 00001","ADMIN",1,NOW-dt.timedelta(days=240)),
         (2,"Demo Customer","customer@technest.dev",cust_hash,"+91 90000 00002","CUSTOMER",1,NOW-dt.timedelta(days=200))]
names = [("Aarav Sharma","aarav.sharma@example.com"),("Priya Natarajan","priya.natarajan@example.com"),("Karthik Subramanian","karthik.s@example.com"),("Meera Iyer","meera.iyer@example.com"),("Rohan Mehta","rohan.mehta@example.com")]
for i,(n,e) in enumerate(names):
    users.append((3+i,n,e,cust_hash,f"+91 9000{i+3:06d}","CUSTOMER",1,NOW-dt.timedelta(days=random.randint(20,190))))
users.append((8,"Sneha Reddy","sneha.reddy@example.com",cust_hash,"+91 90000 00008","CUSTOMER",0,NOW-dt.timedelta(days=95)))  # disabled demo account
out.append(ins("users",["id","full_name","email","password_hash","phone","role","enabled","created_at"],users))
out.append(ins("categories",["id","name","slug","description","image_url"],
  [(c,n,slug(n),d,img(POOLS[c][0])) for c,n,d in CATEGORIES]))

CITIES=[("Chennai","Tamil Nadu","600001"),("Bengaluru","Karnataka","560001"),("Hyderabad","Telangana","500001"),("Coimbatore","Tamil Nadu","641001"),("Mumbai","Maharashtra","400001"),("New Delhi","Delhi","110001"),("Vellore","Tamil Nadu","632001")]
addr, addr_by_user, aid = [], {}, 1
for u in users[1:]:
    for k in range(2 if u[0]==2 else 1):
        c = CITIES[(u[0]+k) % len(CITIES)]
        row=(aid,u[0],"Home" if k==0 else "Office",u[1],u[4],f"{random.randint(11,240)}, {random.choice(['Gandhi Road','MG Road','Lake View Street','Anna Salai','Park Avenue'])}",
             f"Near {random.choice(['Central Park','Bus Stand','Metro Station','Town Hall'])}" if k==0 else None,c[0],c[1],c[2],"India",1 if k==0 else 0)
        addr.append(row); addr_by_user.setdefault(u[0],[]).append(row); aid+=1
out.append(ins("addresses",["id","user_id","label","recipient_name","phone","line1","line2","city","state","postal_code","country","is_default"],addr))

# products
prod_rows, img_rows, spec_rows, inv_rows, products = [], [], [], [], []
for pid,(cat,brand,name,price,disc,stock,feat,blurb,specs) in enumerate(P,1):
    created = NOW - dt.timedelta(days=random.randint(40,230)) if pid % 5 else NOW - dt.timedelta(days=random.randint(2,24))
    desc = (blurb + f" Sold and shipped by TechNest with a 7-day replacement window and manufacturer warranty. "
            "This is sample catalogue data created for demonstration; specifications and prices are illustrative.")
    d = disc if disc and disc < price else None
    products.append(dict(id=pid,cat=cat,brand=brand,name=name,price=price,disc=d,stock=stock,created=created,sold=random.randint(15,420)))
    prod_rows.append((pid,cat,name,slug(name),brand,desc,price,d,stock,5,feat,1,created))
    pool = POOLS[cat]
    for s in range(3 if len(pool)>=3 else len(pool)):
        img_rows.append((pid,img(pool[(pid+s)%len(pool)]),f"{name} - view {s+1}",s))
    for so,kv in enumerate(specs.split("|")):
        k,v = kv.split(":",1); spec_rows.append((pid,k,v,so))
    inv_rows.append((pid,stock,stock,"INITIAL","Seed data opening stock",created))
# products insert comes after orders are computed (needs ratings), so build later

# orders
cust_ids=[2]*6+[3,4,5,6,7]*2   # weighted toward demo customer
order_rows,item_rows,hist_rows,pay_rows,orders=[],[],[],[],[]
oid=1; iid=1
def onum(dtv,i): return f"TN-{dtv.strftime('%Y%m%d')}-{hashlib.sha1(str(i).encode()).hexdigest()[:6].upper()}"
for n in range(58):
    uid=random.choice(cust_ids)
    placed=NOW-dt.timedelta(days=(random.randint(0,11) if n%3==0 else random.randint(1,178)),hours=random.randint(0,20),minutes=random.randint(0,59))
    age=(NOW-placed).days
    r=random.random()
    if age<=11 and n%3==0: status=random.choice(["PLACED","PLACED","CONFIRMED","PROCESSING","PROCESSING","SHIPPED","SHIPPED","DELIVERED"] if age>3 else ["PLACED","PLACED","CONFIRMED","PROCESSING"])
    elif age>18: status="CANCELLED" if r<0.11 else "DELIVERED"
    elif age>8: status="CANCELLED" if r<0.08 else random.choice(["DELIVERED","SHIPPED","SHIPPED"])
    elif age>4: status=random.choice(["PROCESSING","SHIPPED","CONFIRMED"])
    else: status=random.choice(["PLACED","PLACED","CONFIRMED","PROCESSING"])
    picks=random.sample(products,random.choice([1,1,2,2,3]))
    items=[]; sub=0; save=0
    for p in picks:
        qty=random.choice([1,1,1,2]); unit=p["disc"] or p["price"]
        items.append((p,qty,unit)); sub+=unit*qty; save+=(p["price"]-unit)*qty
    ship=0 if sub>=5000 else 99; total=sub+ship
    a=random.choice(addr_by_user[uid]); method=random.choice(["COD","DEMO_ONLINE"])
    path={"PLACED":["PLACED"],"CONFIRMED":["PLACED","CONFIRMED"],"PROCESSING":["PLACED","CONFIRMED","PROCESSING"],
          "SHIPPED":["PLACED","CONFIRMED","PROCESSING","SHIPPED"],"DELIVERED":["PLACED","CONFIRMED","PROCESSING","SHIPPED","DELIVERED"],
          "CANCELLED":["PLACED"]+(["CONFIRMED"] if random.random()<.4 else [])+["CANCELLED"]}[status]
    t=placed; times=[]
    for i,s in enumerate(path):
        if i: t=t+dt.timedelta(hours=random.randint(6,40))
        times.append(t)
    order_rows.append((oid,onum(placed,oid),uid,status,sub,save,ship,total,a[3],a[4],a[5],a[6],a[7],a[8],a[9],a[10],1 if status=="CANCELLED" else 0,placed,times[-1]))
    for s,tt in zip(path,times):
        note={"PLACED":"Order placed","CANCELLED":"Order cancelled","DELIVERED":"Delivered to customer"}.get(s,f"Status changed to {s}")
        hist_rows.append((oid,s,note,1 if s not in("PLACED",) and status!="CANCELLED" else None,tt))
    for p,qty,unit in items:
        item_rows.append((iid,oid,p["id"],p["name"],img(POOLS[p["cat"]][(p["id"])%len(POOLS[p["cat"]])]),unit,p["price"],qty,unit*qty)); iid+=1
        if status!="CANCELLED": p["sold"]+=qty
    if method=="DEMO_ONLINE":
        pst="REFUNDED" if status=="CANCELLED" else "PAID"; paid=placed
        ref="DEMO-"+hashlib.sha1(f"p{oid}".encode()).hexdigest()[:10].upper()
    else:
        pst="CANCELLED" if status=="CANCELLED" else ("PAID" if status=="DELIVERED" else "PENDING"); ref=None
        paid=times[-1] if pst=="PAID" else None
    pay_rows.append((oid,method,pst,total,ref,1,paid,placed))
    orders.append(dict(id=oid,uid=uid,status=status,items=items,deliv=times[-1]))
    oid+=1

# reviews from delivered orders
GOOD=[("Excellent purchase","Arrived on time and works exactly as described. Very happy with the build quality."),("Worth the money","Great performance for the price. I've been using it daily and it has been flawless."),("Highly recommended","Setup was easy and the quality is top notch. Would buy again."),("Impressive","Better than I expected. Battery life and display are both superb.")]
OK=[("Good, with small gaps","Does the job well. A couple of minor niggles but nothing that spoils it."),("Decent value","Solid product overall, though I expected slightly better accessories in the box.")]
BAD=[("Not what I hoped","Had issues after a week of use. Support was helpful but it was disappointing.")]
seen=set(); review_rows=[]; agg={}
for o in orders:
    if o["status"]!="DELIVERED": continue
    for p,qty,unit in o["items"]:
        if (o["uid"],p["id"]) in seen or random.random()>0.7: continue
        seen.add((o["uid"],p["id"]))
        rating=random.choices([5,4,3,2,1],[48,32,12,5,3])[0]
        title,comment=random.choice(GOOD if rating>=4 else OK if rating==3 else BAD)
        when=o["deliv"]+dt.timedelta(days=random.randint(1,9),hours=random.randint(0,10))
        if when>NOW: when=NOW-dt.timedelta(hours=1)
        review_rows.append((p["id"],o["uid"],rating,title,comment,1 if (rating==1) else 0,when))
        agg.setdefault(p["id"],[]).append(rating)

pr=[]
for row in prod_rows:
    pid=row[0]; rs=agg.get(pid,[]); avg=round(sum(rs)/len(rs),2) if rs else 0
    pr.append(row+(avg,len(rs),products[pid-1]["sold"]))
out.append(ins("products",["id","category_id","name","slug","brand","description","price","discount_price","stock_quantity","low_stock_threshold","featured","active","created_at","rating_avg","rating_count","sold_count"],
  [(r[0],r[1],r[2],r[3],r[4],r[5],r[6],r[7],r[8],r[9],r[10],r[11],r[12],r[13],r[14],r[15]) for r in pr]))
out.append(ins("product_images",["product_id","url","alt_text","sort_order"],img_rows))
out.append(ins("product_specifications",["product_id","spec_key","spec_value","sort_order"],spec_rows))
out.append(ins("inventory_adjustments",["product_id","delta","quantity_after","reason","note","created_at"],inv_rows))
out.append(ins("orders",["id","order_number","user_id","status","subtotal","discount_total","shipping_fee","total_amount","ship_name","ship_phone","ship_line1","ship_line2","ship_city","ship_state","ship_postal","ship_country","stock_restored","placed_at","updated_at"],order_rows))
out.append(ins("order_items",["id","order_id","product_id","product_name","product_image","unit_price","original_price","quantity","line_total"],item_rows))
out.append(ins("order_status_history",["order_id","status","note","changed_by","created_at"],hist_rows))
out.append(ins("payments",["order_id","method","status","amount","transaction_ref","simulated","paid_at","created_at"],pay_rows))
out.append(ins("reviews",["product_id","user_id","rating","title","comment","reported","created_at"],review_rows))
wl=[(2,3),(2,18),(2,25),(2,36),(3,1),(3,7),(4,12),(5,27)]
out.append(ins("wishlists",["user_id","product_id"],wl))
out.append(ins("newsletter_subscribers",["email"],[("aarav.sharma@example.com",),("subscriber@example.com",)]))
OUT.write_text("".join(out),encoding="utf-8")
print("wrote",OUT,"| products",len(P),"| orders",len(order_rows),"| items",len(item_rows),"| reviews",len(review_rows))
