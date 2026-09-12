export const formatResponseBody = (body: string) => {
	if (!body) return "";
	try {
		const json = JSON.parse(body);
		return JSON.stringify(json, null, 2);
	} catch {
		return body;
	}
};
