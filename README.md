# Nameserver-Sort

Generates a list of nameservers sorted by their resolve ms

## Usage

### Options

#### Country Code

Fetch the entries for Kenya:
```shell
node main.js -c ke
```

#### Write Path

Fetch the entries for the US and save the results in the user's downloads directory
```shell
node main.js -w ~/Downloads
```

#### Debug Printing

Enable debug printing on the command line
```shell
node main.js -d
```

#### Max Servers

Limit the maximum amount of servers to test to 10
```shell
node main.js -m 10
```

#### Filename

Use a custom filename 'test' for the output
```shell
node main.js -f test
```
