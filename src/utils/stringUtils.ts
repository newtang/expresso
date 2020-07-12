
export function lowercaseStaticParts(path: string): string{
	return path.split('/').map(part => {
		return part.startsWith(':')
			? part
			: part.toLowerCase();
	}).join('/');
}