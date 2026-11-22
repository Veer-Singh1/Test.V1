# Generate an illustrative East African coast chart (equirectangular) for the voyage section.
K=20; LON0=26; LAT0=15
def P(lon,lat): return ((lon-LON0)*K, (LAT0-lat)*K)
def fmt(v): return f"{v:.1f}".rstrip('0').rstrip('.')
def catmull(pts, closed=False, t=0.5):
    n=len(pts); out=[f"M{fmt(pts[0][0])} {fmt(pts[0][1])}"]
    rng = range(n) if closed else range(n-1)
    for i in rng:
        p0=pts[(i-1)%n] if (closed or i>0) else pts[i]
        p1=pts[i]; p2=pts[(i+1)%n]
        p3=pts[(i+2)%n] if (closed or i+2<n) else p2
        c1=(p1[0]+(p2[0]-p0[0])*t/3, p1[1]+(p2[1]-p0[1])*t/3)
        c2=(p2[0]-(p3[0]-p1[0])*t/3, p2[1]-(p3[1]-p1[1])*t/3)
        out.append(f"C{fmt(c1[0])} {fmt(c1[1])} {fmt(c2[0])} {fmt(c2[1])} {fmt(p2[0])} {fmt(p2[1])}")
    if closed: out.append("Z")
    return "".join(out)

africa_coast=[(40.1,15),(41.2,14.1),(42.7,13.0),(43.3,12.5),(42.8,11.8),(43.15,11.6),(43.47,11.35),(45.0,10.44),(47.0,10.9),(49.18,11.28),(51.28,11.83),(51.4,10.45),(50.6,9.0),(49.85,7.98),(48.53,5.35),(47.0,3.5),(45.34,2.04),(44.0,1.0),(42.55,-0.36),(41.6,-1.65),(40.9,-2.27),(40.12,-3.22),(39.67,-4.05),(39.1,-5.07),(38.9,-6.44),(39.29,-6.82),(39.5,-8.93),(39.72,-10.0),(40.19,-10.27),(40.64,-10.68),(40.52,-12.97),(40.67,-14.54),(40.73,-15.03),(39.91,-16.23),(38.2,-17.2),(36.89,-17.88),(36.47,-18.58),(34.84,-19.83),(35.1,-20.98),(35.32,-22.0),(35.54,-23.79),(35.2,-24.5),(33.65,-25.05),(32.95,-26.0),(32.89,-26.85),(32.42,-28.38),(32.08,-28.8),(31.05,-29.87),(30.45,-30.74),(29.55,-31.63),(27.91,-33.02),(26.89,-33.6),(26,-33.75)]
pts=[P(*c) for c in africa_coast]
coast=catmull(pts)
# land fill: coast then left edge and top
land=coast+f"L{fmt(P(26,-33.75)[0])} {fmt(P(26,-34.5)[1])}L-20 {fmt(P(26,-34.5)[1])}L-20 -20L{fmt(P(40.1,15)[0])} -20Z"
arabia=[(42.85,15),(43.25,13.32),(43.45,12.65),(45.03,12.78),(45.7,13.35),(47.5,13.9),(49.13,14.53),(50.4,15)]
ap=[P(*c) for c in arabia]
arabia_coast=catmull(ap)
arabia_land=arabia_coast+f"L{fmt(P(50.4,15)[0])} -20L{fmt(ap[0][0])} -20Z"
mada=[(49.26,-11.95),(50.0,-13.37),(50.28,-14.9),(50.2,-15.97),(49.4,-18.15),(48.35,-21.23),(47.83,-22.82),(46.99,-25.03),(45.15,-25.6),(44.0,-24.6),(43.67,-23.35),(43.37,-21.75),(44.28,-20.28),(44.03,-18.06),(44.45,-16.18),(46.32,-15.72),(47.76,-14.63),(48.3,-13.4),(49.29,-12.28)]
madagascar=catmull([P(*c) for c in mada],closed=True)
zanz=catmull([P(*c) for c in [(39.2,-5.75),(39.45,-6.0),(39.55,-6.35),(39.45,-6.45),(39.25,-6.2)]],closed=True)
pemba=catmull([P(*c) for c in [(39.75,-4.9),(39.85,-5.2),(39.7,-5.45),(39.62,-5.2)]],closed=True)
socotra=catmull([P(*c) for c in [(53.3,12.65),(53.9,12.7),(54.5,12.55),(54.0,12.3),(53.5,12.4)]],closed=True)
comoros=[P(43.35,-11.65),P(44.4,-12.2),P(45.15,-12.8)]

route=[(43.15,11.6),(44.6,12.05),(48.0,12.45),(51.9,12.25),(52.4,10.6),(51.3,7.6),(49.6,4.6),(47.0,1.6),(44.2,-1.4),(41.4,-3.6),(39.67,-4.05),(40.7,-4.9),(40.2,-6.5),(39.29,-6.82),(40.3,-8.0),(41.4,-10.6),(41.9,-13.4),(41.3,-16.0),(38.6,-18.6),(36.0,-19.9),(34.84,-19.83),(35.9,-21.0),(36.3,-23.6),(34.9,-26.0),(33.5,-28.3),(32.2,-29.6),(31.05,-29.87)]
routepath=catmull([P(*c) for c in route])
ports={'djibouti':(43.15,11.6),'mombasa':(39.67,-4.05),'dar':(39.29,-6.82),'beira':(34.84,-19.83),'durban':(31.05,-29.87)}
print("COAST", coast); print(); print("LAND", land); print(); print("ARABIA_COAST", arabia_coast); print(); print("ARABIA_LAND", arabia_land); print(); print("MADA", madagascar); print(); print("ZANZ", zanz); print("PEMBA", pemba); print("SOCOTRA", socotra); print("COMOROS", comoros); print(); print("ROUTE", routepath); print()
for k,v in ports.items(): print(k, P(*v))
# graticule
for lat in range(10,-35,-10): print('lat',lat, P(26,lat)[1])
for lon in range(30,55,10): print('lon',lon, P(lon,0)[0])
print('labels', 'indian', P(46,-4), 'moz', P(37.2,-21.5), 'aden',P(47,12.2),'africa',P(31,-5), 'mada', P(46.5,-19.5))
