import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, ComposedChart, Area, AreaChart, ReferenceLine, Legend } from "recharts";
import { generateIVSurface, getIVTermStructure, generateVRPHistory, generateGreeksHeatmap } from "@/lib/advancedMockData";
import { getIVAnalytics, generateIVHistory } from "@/lib/mockData";
import { Activity, TrendingUp, Gauge, Grid3X3 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const tooltipStyle = { backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "11px" };
const spotMap: Record<string, { spot: number; step: number }> = {
  NIFTY: { spot: 24250.75, step: 50 },
  BANKNIFTY: { spot: 51850.40, step: 100 },
  FINNIFTY: { spot: 23180.55, step: 50 },
};

function getHeatColor(iv: number, min: number, max: number): string {
  const pct = (iv - min) / (max - min);
  if (pct < 0.25) return "bg-bullish/20 text-bullish";
  if (pct < 0.5) return "bg-bullish/10";
  if (pct < 0.75) return "bg-warning/15 text-warning";
  return "bg-bearish/20 text-bearish";
}

export default function VolatilitySurface() {
  const [symbol, setSymbol] = useState("NIFTY");
  const [selectedExpiries, setSelectedExpiries] = useState<string[]>([]);
  const config = spotMap[symbol] || spotMap.NIFTY;

  const surface = useMemo(() => generateIVSurface(config.spot, config.step), [symbol]);
  const termStructure = useMemo(() => getIVTermStructure(config.spot, config.step), [symbol]);
  const ivAnalytics = useMemo(() => getIVAnalytics(symbol), [symbol]);
  const ivHistory = useMemo(() => generateIVHistory(symbol), [symbol]);
  const vrpHistory = useMemo(() => generateVRPHistory(symbol), [symbol]);
  const greeksHeatmap = useMemo(() => generateGreeksHeatmap(config.spot, config.step), [symbol]);
  const [greekType, setGreekType] = useState<"delta" | "gamma" | "theta" | "vega">("delta");
  const [greekSide, setGreekSide] = useState<"ce" | "pe">("ce");

  // Build heatmap grid
  const strikes = [...new Set(surface.map(p => p.strike))].sort((a, b) => a - b);
  const expiries = [...new Set(surface.map(p => p.expiry))];
  const allIVs = surface.map(p => p.iv);
  const minIV = Math.min(...allIVs);
  const maxIV = Math.max(...allIVs);
  const atmStrike = Math.round(config.spot / config.step) * config.step;

  // IV skew for current expiry
  const nearTermSkew = surface.filter(p => p.expiry === expiries[0]);

  // Initialize selected expiries
  const activeExpiries = selectedExpiries.length > 0 ? selectedExpiries : expiries.slice(0, 2);

  // Multi-expiry IV smile data: one data point per strike with IV for each expiry
  const multiExpirySmile = useMemo(() => {
    return strikes.map(strike => {
      const point: Record<string, any> = { strike };
      activeExpiries.forEach(exp => {
        const match = surface.find(p => p.strike === strike && p.expiry === exp);
        point[exp] = match ? match.iv : null;
      });
      return point;
    });
  }, [strikes, activeExpiries, surface]);

  const smileColors = ["hsl(210 100% 52%)", "hsl(142 71% 45%)", "hsl(38 92% 50%)", "hsl(280 80% 60%)", "hsl(0 84% 60%)"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Volatility Surface & Skew</h1>
          <p className="text-sm text-muted-foreground">IV Surface · Term Structure · Skew Analysis · IV Cone</p>
        </div>
        <Select value={symbol} onValueChange={setSymbol}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="NIFTY">NIFTY</SelectItem>
            <SelectItem value="BANKNIFTY">BANKNIFTY</SelectItem>
            <SelectItem value="FINNIFTY">FINNIFTY</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* IV Summary */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        <Card><CardContent className="pt-3 pb-3 text-center">
          <p className="text-[9px] text-muted-foreground">ATM IV</p>
          <p className="text-xl font-bold font-mono">{ivAnalytics.currentIV}%</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3 text-center">
          <p className="text-[9px] text-muted-foreground">IV Rank</p>
          <p className={`text-xl font-bold font-mono ${ivAnalytics.ivRank > 70 ? "text-bearish" : ivAnalytics.ivRank < 30 ? "text-bullish" : ""}`}>{ivAnalytics.ivRank}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3 text-center">
          <p className="text-[9px] text-muted-foreground">IV %ile</p>
          <p className="text-lg font-bold font-mono">{ivAnalytics.ivPercentile}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3 text-center">
          <p className="text-[9px] text-muted-foreground">52W Range</p>
          <p className="text-sm font-bold font-mono">{ivAnalytics.iv52Low}% - {ivAnalytics.iv52High}%</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3 text-center">
          <p className="text-[9px] text-muted-foreground">HV (1M)</p>
          <p className="text-lg font-bold font-mono">{ivAnalytics.hvMonth}%</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3 text-center">
          <p className="text-[9px] text-muted-foreground">IV - HV Spread</p>
          <p className={`text-lg font-bold font-mono ${ivAnalytics.currentIV > ivAnalytics.hvMonth ? "text-bearish" : "text-bullish"}`}>
            {(ivAnalytics.currentIV - ivAnalytics.hvMonth).toFixed(1)}%
          </p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="smile">
        <TabsList className="flex-wrap">
          <TabsTrigger value="smile">IV Smile</TabsTrigger>
          <TabsTrigger value="surface">IV Surface Heatmap</TabsTrigger>
          <TabsTrigger value="vrp">VRP Analysis</TabsTrigger>
          <TabsTrigger value="greeks-heatmap">Greeks Heatmap</TabsTrigger>
          <TabsTrigger value="skew">IV Skew Bars</TabsTrigger>
          <TabsTrigger value="term">Term Structure</TabsTrigger>
          <TabsTrigger value="history">IV vs HV History</TabsTrigger>
        </TabsList>

        {/* Multi-Expiry IV Smile — like the reference image */}
        <TabsContent value="smile">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" /> IV Smile / Skew by Expiry
                </CardTitle>
                <ToggleGroup
                  type="multiple"
                  value={activeExpiries}
                  onValueChange={(v) => setSelectedExpiries(v.length > 0 ? v : expiries.slice(0, 2))}
                  className="flex-wrap"
                >
                  {expiries.map((exp, i) => {
                    const parts = exp.split(" ");
                    return (
                      <ToggleGroupItem
                        key={exp}
                        value={exp}
                        className="text-[10px] h-7 px-2 data-[state=on]:bg-primary/15 data-[state=on]:text-primary"
                      >
                        <div className="flex flex-col items-center leading-none">
                          <span className="text-[8px] text-muted-foreground">{parts[1] || ""}</span>
                          <span className="font-bold">{parts[0]}</span>
                        </div>
                      </ToggleGroupItem>
                    );
                  })}
                </ToggleGroup>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Classic volatility smile: IV plotted across strikes for each expiry. The U-shape shows how OTM options carry higher IV (crash/rally premium).
                Dashed line = spot price. Compare near vs far expiries to spot term structure changes.
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={multiExpirySmile} margin={{ top: 10, right: 60, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                    <XAxis
                      dataKey="strike"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(v) => v.toLocaleString("en-IN")}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      domain={["dataMin - 2", "dataMax + 5"]}
                      tickFormatter={(v) => `${v.toFixed(0)}%`}
                      orientation="right"
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number, name: string) => [`${value?.toFixed(2)}%`, name]}
                      labelFormatter={(label) => `Strike: ${Number(label).toLocaleString("en-IN")}`}
                    />
                    <ReferenceLine
                      x={atmStrike}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="6 4"
                      strokeWidth={1.5}
                      label={{ value: `Spot ${atmStrike.toLocaleString("en-IN")}`, position: "top", fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    />
                    {activeExpiries.map((exp, i) => (
                      <Line
                        key={exp}
                        type="monotone"
                        dataKey={exp}
                        stroke={smileColors[i % smileColors.length]}
                        strokeWidth={2.5}
                        dot={false}
                        name={exp}
                        connectNulls
                      />
                    ))}
                    <Legend
                      verticalAlign="top"
                      height={30}
                      wrapperStyle={{ fontSize: "11px" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="surface">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" /> IV Surface (Strike × Expiry)
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-[10px]">
                    <TableHead className="sticky left-0 bg-card z-10">Strike</TableHead>
                    {expiries.map(e => <TableHead key={e} className="text-center">{e}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {strikes.map(strike => (
                    <TableRow key={strike} className={`text-[11px] font-mono ${strike === atmStrike ? "bg-primary/10 border-y border-primary/30" : ""}`}>
                      <TableCell className="sticky left-0 bg-card z-10 font-medium">
                        {strike.toLocaleString("en-IN")}
                        {strike === atmStrike && <Badge variant="outline" className="ml-1 text-[8px] px-1 py-0 h-3.5 border-primary text-primary">ATM</Badge>}
                      </TableCell>
                      {expiries.map(exp => {
                        const point = surface.find(p => p.strike === strike && p.expiry === exp);
                        const iv = point?.iv || 0;
                        return (
                          <TableCell key={exp} className={`text-center py-1.5 ${getHeatColor(iv, minIV, maxIV)}`}>
                            {iv.toFixed(1)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── VRP Analysis ── */}
        <TabsContent value="vrp">
          <div className="grid lg:grid-cols-3 gap-4">
            {/* VRP Summary Cards */}
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-5 gap-2">
              {(() => {
                const latest = vrpHistory[vrpHistory.length - 1];
                const avg = vrpHistory.reduce((s, p) => s + p.vrp, 0) / vrpHistory.length;
                const positiveDays = vrpHistory.filter(p => p.vrp > 0).length;
                const pctPositive = Math.round((positiveDays / vrpHistory.length) * 100);
                return (
                  <>
                    <Card><CardContent className="pt-3 pb-3 text-center">
                      <p className="text-[9px] text-muted-foreground">Current VRP</p>
                      <p className={`text-xl font-bold font-mono ${latest.vrp > 0 ? "text-bullish" : "text-bearish"}`}>
                        {latest.vrp > 0 ? "+" : ""}{latest.vrp.toFixed(2)}%
                      </p>
                    </CardContent></Card>
                    <Card><CardContent className="pt-3 pb-3 text-center">
                      <p className="text-[9px] text-muted-foreground">Avg VRP (90D)</p>
                      <p className={`text-xl font-bold font-mono ${avg > 0 ? "text-bullish" : "text-bearish"}`}>
                        {avg > 0 ? "+" : ""}{avg.toFixed(2)}%
                      </p>
                    </CardContent></Card>
                    <Card><CardContent className="pt-3 pb-3 text-center">
                      <p className="text-[9px] text-muted-foreground">Current IV</p>
                      <p className="text-xl font-bold font-mono">{latest.iv.toFixed(1)}%</p>
                    </CardContent></Card>
                    <Card><CardContent className="pt-3 pb-3 text-center">
                      <p className="text-[9px] text-muted-foreground">Current RV</p>
                      <p className="text-xl font-bold font-mono">{latest.rv.toFixed(1)}%</p>
                    </CardContent></Card>
                    <Card><CardContent className="pt-3 pb-3 text-center">
                      <p className="text-[9px] text-muted-foreground">% Days IV &gt; RV</p>
                      <p className={`text-xl font-bold font-mono ${pctPositive > 50 ? "text-bullish" : "text-bearish"}`}>{pctPositive}%</p>
                    </CardContent></Card>
                  </>
                );
              })()}
            </div>

            {/* IV vs RV Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-primary" /> Implied Vol vs Realized Vol (90 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={vrpHistory}>
                      <defs>
                        <linearGradient id="vrpFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                      <XAxis dataKey="date" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} domain={["dataMin - 1", "dataMax + 2"]} tickFormatter={v => `${v}%`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}%`, ""]} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Area type="monotone" dataKey="iv" stroke="hsl(210 100% 52%)" fill="url(#vrpFill)" strokeWidth={2} name="Implied Vol" />
                      <Line type="monotone" dataKey="rv" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={false} name="Realized Vol" strokeDasharray="5 3" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* VRP Spread Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">VRP Spread (IV − RV)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vrpHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                      <XAxis dataKey="date" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `${v}%`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}%`, "VRP"]} />
                      <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                      <Bar dataKey="vrp" name="VRP" radius={[2, 2, 0, 0]}>
                        {vrpHistory.map((entry, i) => (
                          <Cell key={i} fill={entry.vrp >= 0 ? "hsl(142 71% 45% / 0.6)" : "hsl(0 84% 60% / 0.6)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 p-2 rounded bg-accent/30 text-[10px] text-muted-foreground space-y-0.5">
                  <p><span className="text-bullish font-medium">Positive VRP</span>: IV &gt; RV → Options are overpriced → Edge for sellers</p>
                  <p><span className="text-bearish font-medium">Negative VRP</span>: IV &lt; RV → Options are underpriced → Edge for buyers</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Greeks Heatmap ── */}
        <TabsContent value="greeks-heatmap">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4 text-primary" /> Greeks Heatmap (Strike × Expiry)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <ToggleGroup type="single" value={greekSide} onValueChange={(v) => v && setGreekSide(v as any)} className="bg-muted rounded-md p-0.5">
                    <ToggleGroupItem value="ce" className="text-[10px] h-6 px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded">Calls</ToggleGroupItem>
                    <ToggleGroupItem value="pe" className="text-[10px] h-6 px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded">Puts</ToggleGroupItem>
                  </ToggleGroup>
                  <ToggleGroup type="single" value={greekType} onValueChange={(v) => v && setGreekType(v as any)} className="bg-muted rounded-md p-0.5">
                    <ToggleGroupItem value="delta" className="text-[10px] h-6 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded">Δ Delta</ToggleGroupItem>
                    <ToggleGroupItem value="gamma" className="text-[10px] h-6 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded">Γ Gamma</ToggleGroupItem>
                    <ToggleGroupItem value="theta" className="text-[10px] h-6 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded">Θ Theta</ToggleGroupItem>
                    <ToggleGroupItem value="vega" className="text-[10px] h-6 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded">ν Vega</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-auto">
              {(() => {
                const hStrikes = [...new Set(greeksHeatmap.map(p => p.strike))].sort((a, b) => a - b);
                const hExpiries = [...new Set(greeksHeatmap.map(p => p.expiry))];
                const getVal = (p: typeof greeksHeatmap[0]) => {
                  const key = `${greekSide}${greekType.charAt(0).toUpperCase() + greekType.slice(1)}` as keyof typeof p;
                  return p[key] as number;
                };
                const allVals = greeksHeatmap.map(getVal);
                const minVal = Math.min(...allVals);
                const maxVal = Math.max(...allVals);

                const getGreekColor = (val: number): string => {
                  if (greekType === "delta") {
                    const abs = Math.abs(val);
                    if (abs > 0.8) return "bg-primary/30 text-primary font-semibold";
                    if (abs > 0.5) return "bg-primary/15";
                    if (abs > 0.3) return "bg-accent/50";
                    return "text-muted-foreground";
                  }
                  if (greekType === "gamma") {
                    const pct = maxVal > 0 ? val / maxVal : 0;
                    if (pct > 0.7) return "bg-warning/25 text-warning font-semibold";
                    if (pct > 0.4) return "bg-warning/10";
                    return "text-muted-foreground";
                  }
                  if (greekType === "theta") {
                    if (val < -5) return "bg-bearish/25 text-bearish font-semibold";
                    if (val < -2) return "bg-bearish/10 text-bearish";
                    return "text-muted-foreground";
                  }
                  // vega
                  const pct = maxVal > 0 ? val / maxVal : 0;
                  if (pct > 0.7) return "bg-primary/25 text-primary font-semibold";
                  if (pct > 0.4) return "bg-primary/10";
                  return "text-muted-foreground";
                };

                const formatVal = (val: number): string => {
                  if (greekType === "delta") return val.toFixed(3);
                  if (greekType === "gamma") return val.toFixed(4);
                  if (greekType === "theta") return val.toFixed(2);
                  return val.toFixed(2);
                };

                return (
                  <Table>
                    <TableHeader>
                      <TableRow className="text-[10px]">
                        <TableHead className="sticky left-0 bg-card z-10">Strike</TableHead>
                        {hExpiries.map(e => <TableHead key={e} className="text-center min-w-[70px]">{e}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hStrikes.map(strike => (
                        <TableRow key={strike} className={`text-[11px] font-mono ${strike === atmStrike ? "bg-primary/10 border-y border-primary/30" : ""}`}>
                          <TableCell className="sticky left-0 bg-card z-10 font-medium">
                            {strike.toLocaleString("en-IN")}
                            {strike === atmStrike && <Badge variant="outline" className="ml-1 text-[8px] px-1 py-0 h-3.5 border-primary text-primary">ATM</Badge>}
                          </TableCell>
                          {hExpiries.map(exp => {
                            const point = greeksHeatmap.find(p => p.strike === strike && p.expiry === exp);
                            const val = point ? getVal(point) : 0;
                            return (
                              <TableCell key={exp} className={`text-center py-1.5 tabular-nums ${getGreekColor(val)}`}>
                                {formatVal(val)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                );
              })()}

              {/* Legend */}
              <div className="mt-3 flex items-center gap-4 text-[9px] text-muted-foreground">
                {greekType === "delta" && <>
                  <span><span className="inline-block w-3 h-3 rounded bg-primary/30 mr-1" />High |Δ| (&gt;0.8)</span>
                  <span><span className="inline-block w-3 h-3 rounded bg-primary/15 mr-1" />Medium (0.5-0.8)</span>
                  <span className="ml-auto">Delta measures price sensitivity to ₹1 move in underlying</span>
                </>}
                {greekType === "gamma" && <>
                  <span><span className="inline-block w-3 h-3 rounded bg-warning/25 mr-1" />High Γ (near ATM)</span>
                  <span className="ml-auto">Gamma peaks at ATM and near expiry — highest delta acceleration</span>
                </>}
                {greekType === "theta" && <>
                  <span><span className="inline-block w-3 h-3 rounded bg-bearish/25 mr-1" />Heavy Θ decay</span>
                  <span><span className="inline-block w-3 h-3 rounded bg-bearish/10 mr-1" />Moderate decay</span>
                  <span className="ml-auto">Theta = daily time decay in ₹. Accelerates near expiry for ATM options</span>
                </>}
                {greekType === "vega" && <>
                  <span><span className="inline-block w-3 h-3 rounded bg-primary/25 mr-1" />High Vega</span>
                  <span className="ml-auto">Vega measures sensitivity to 1% IV change. Higher for longer-dated options</span>
                </>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skew">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">IV Skew (Near-Term Expiry)</CardTitle>
              <p className="text-[10px] text-muted-foreground">Compares call-side vs put-side IV. Steeper put skew = higher crash premium</p>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={nearTermSkew}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                    <XAxis dataKey="strike" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} domain={["dataMin - 1", "dataMax + 1"]} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}%`, ""]} />
                    <ReferenceLine x={atmStrike} stroke="hsl(210 100% 52%)" strokeDasharray="3 3" label={{ value: "ATM", fill: "hsl(210 100% 52%)", fontSize: 9 }} />
                    <Bar dataKey="iv" name="IV" radius={[2, 2, 0, 0]}>
                      {nearTermSkew.map((entry, i) => (
                        <Cell key={i} fill={entry.strike < atmStrike ? "hsl(0 84% 60% / 0.5)" : entry.strike > atmStrike ? "hsl(142 71% 45% / 0.5)" : "hsl(38 92% 50% / 0.7)"} />
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey="iv" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={{ r: 3 }} name="IV Curve" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="term">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">ATM IV Term Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={termStructure}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                      <XAxis dataKey="expiry" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} domain={["dataMin - 1", "dataMax + 2"]} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="atmIV" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(38 92% 50%)" }} name="ATM IV %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Skew by Expiry (OTM Put vs Call)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={termStructure}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                      <XAxis dataKey="expiry" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}%`, ""]} />
                      <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                      <Bar dataKey="putSkew" fill="hsl(0 84% 60% / 0.6)" name="Put Skew" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="callSkew" fill="hsl(142 71% 45% / 0.6)" name="Call Skew" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> IV vs Historical Volatility (90 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ivHistory}>
                    <defs>
                      <linearGradient id="ivFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(210 100% 52%)" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="hsl(210 100% 52%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="iv" stroke="hsl(210 100% 52%)" fill="url(#ivFill)" strokeWidth={2} name="Implied Vol" />
                    <Line type="monotone" dataKey="hv" stroke="hsl(38 92% 50%)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Historical Vol" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
