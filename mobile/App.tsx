import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase, ProcessingTime } from "./lib/supabase";

const VISA_TYPES = [
  { key: "all", label: "All" },
  { key: "visitor-outside-canada", label: "Visitor" },
  { key: "work", label: "Work" },
  { key: "study", label: "Study" },
  { key: "supervisa", label: "Super Visa" },
  { key: "child_dependent", label: "Dependent" },
  { key: "child_adopted", label: "Adopted" },
  { key: "refugees_gov", label: "Gov. Refugee" },
  { key: "refugees_private", label: "Pvt. Refugee" },
];

export default function App() {
  const [data, setData] = useState<ProcessingTime[]>([]);
  const [filtered, setFiltered] = useState<ProcessingTime[]>([]);
  const [selectedVisa, setSelectedVisa] = useState("all");
  const [countrySearch, setCountrySearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [alertEmail, setAlertEmail] = useState("");
  const [alertSent, setAlertSent] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: rows, error } = await supabase
        .from("latest_processing_times")
        .select("*")
        .order("processing_weeks", { ascending: true });

      if (error) return;
      setData(rows || []);
      if (rows?.length) setLastUpdated(rows[0].fetched_at);
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    let result = data;
    if (selectedVisa !== "all") {
      result = result.filter((r) => r.visa_type === selectedVisa);
    }
    if (countrySearch.trim()) {
      const q = countrySearch.toLowerCase();
      result = result.filter(
        (r) =>
          r.country_name.toLowerCase().includes(q) ||
          r.country_code.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [data, selectedVisa, countrySearch]);

  async function subscribeAlert() {
    if (!alertEmail) return;
    await supabase.from("alert_subscriptions").insert({
      email: alertEmail,
      visa_type: selectedVisa === "all" ? "visitor-outside-canada" : selectedVisa,
      country_code: "IND",
    });
    setAlertSent(true);
    setAlertEmail("");
  }

  const indiaRows = filtered.filter((r) => r.country_code === "IND");

  function getBadgeColor(weeks: number) {
    if (weeks <= 4) return "#14532d";
    if (weeks <= 12) return "#713f12";
    return "#7f1d1d";
  }

  function getBadgeText(weeks: number) {
    if (weeks <= 4) return "#86efac";
    if (weeks <= 12) return "#fde047";
    return "#fca5a5";
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🍁 IRCC Processing Times</Text>
        <Text style={styles.headerSub}>Canada immigration wait times · updated daily</Text>
        {lastUpdated && (
          <Text style={styles.headerDate}>
            Last updated: {new Date(lastUpdated).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
          </Text>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Visa Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRow}>
          {VISA_TYPES.map((v) => (
            <TouchableOpacity
              key={v.key}
              onPress={() => setSelectedVisa(v.key)}
              style={[styles.pill, selectedVisa === v.key && styles.pillActive]}
            >
              <Text style={[styles.pillText, selectedVisa === v.key && styles.pillTextActive]}>
                {v.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color="#dc2626" style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* India Spotlight */}
            {indiaRows.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🇮🇳 India Processing Times</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {indiaRows.map((row) => (
                    <View key={row.visa_type} style={styles.card}>
                      <Text style={styles.cardLabel}>{row.visa_label}</Text>
                      <Text style={styles.cardValue}>
                        {row.processing_weeks}
                        <Text style={styles.cardUnit}> {row.unit}</Text>
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Search */}
            <View style={styles.section}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search country (e.g. India, Pakistan...)"
                placeholderTextColor="#6b7280"
                value={countrySearch}
                onChangeText={setCountrySearch}
              />
            </View>

            {/* Table */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Processing Times</Text>
              {filtered.map((row, i) => (
                <View key={i} style={styles.tableRow}>
                  <View style={styles.tableLeft}>
                    <Text style={styles.tableVisa}>{row.visa_label}</Text>
                    <Text style={styles.tableCountry}>{row.country_name}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: getBadgeColor(row.processing_weeks) }]}>
                    <Text style={[styles.badgeText, { color: getBadgeText(row.processing_weeks) }]}>
                      {row.processing_weeks} {row.unit}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Alert Signup */}
            <View style={styles.alertBox}>
              <Text style={styles.alertTitle}>Get Alerted When Times Change</Text>
              <Text style={styles.alertSub}>Free email alerts when processing times update</Text>
              {alertSent ? (
                <View style={styles.alertSuccess}>
                  <Text style={styles.alertSuccessText}>You're on the list!</Text>
                </View>
              ) : (
                <View style={styles.alertForm}>
                  <TextInput
                    style={styles.alertInput}
                    placeholder="your@email.com"
                    placeholderTextColor="#6b7280"
                    value={alertEmail}
                    onChangeText={setAlertEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.alertButton} onPress={subscribeAlert}>
                    <Text style={styles.alertButtonText}>Notify Me</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  scroll: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  headerSub: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  headerDate: { color: "#4b5563", fontSize: 11, marginTop: 2 },
  pillsRow: { paddingHorizontal: 12, paddingVertical: 12 },
  pill: { backgroundColor: "#1f2937", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  pillActive: { backgroundColor: "#dc2626" },
  pillText: { color: "#9ca3af", fontSize: 13, fontWeight: "500" },
  pillTextActive: { color: "#fff" },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { color: "#fb923c", fontSize: 15, fontWeight: "600", marginBottom: 10 },
  card: { backgroundColor: "#111827", borderWidth: 1, borderColor: "#1f2937", borderRadius: 12, padding: 14, marginRight: 10, minWidth: 140 },
  cardLabel: { color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  cardValue: { color: "#fff", fontSize: 26, fontWeight: "700", marginTop: 4 },
  cardUnit: { color: "#6b7280", fontSize: 14, fontWeight: "400" },
  searchInput: { backgroundColor: "#1f2937", borderWidth: 1, borderColor: "#374151", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: "#fff", fontSize: 14 },
  tableRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#111827" },
  tableLeft: { flex: 1 },
  tableVisa: { color: "#f9fafb", fontSize: 13 },
  tableCountry: { color: "#6b7280", fontSize: 11, marginTop: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  alertBox: { margin: 16, backgroundColor: "#111827", borderWidth: 1, borderColor: "#1f2937", borderRadius: 16, padding: 16 },
  alertTitle: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 4 },
  alertSub: { color: "#6b7280", fontSize: 12, marginBottom: 12 },
  alertForm: { gap: 8 },
  alertInput: { backgroundColor: "#1f2937", borderWidth: 1, borderColor: "#374151", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: "#fff", fontSize: 14 },
  alertButton: { backgroundColor: "#dc2626", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  alertButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  alertSuccess: { backgroundColor: "#14532d", borderRadius: 10, padding: 12, alignItems: "center" },
  alertSuccessText: { color: "#86efac", fontWeight: "600" },
});
