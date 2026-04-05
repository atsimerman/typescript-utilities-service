import { fetchCountries } from "@/app/actions/countries";
import { TeamSwitcher } from "./team-switcher";

export async function CountrySelector() {
	const countries = await fetchCountries();

	return <TeamSwitcher countries={countries} />;
}
