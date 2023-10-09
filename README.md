# Nameserver Sort

Generates a list of nameservers sorted by their resolve ms

## Usage

Install dependencies via npm and run the `nameserver-sort.js` file

### Options

#### Country Code

Fetch the entries for Kenya:
```shell
./nameserver-sort.js -c ke
```

#### Write Path

Fetch the entries for the US and save the results in the user's downloads directory
```shell
./nameserver-sort.js -w ~/Downloads
```

#### Debug Printing

Enable debug printing on the command line
```shell
./nameserver-sort.js -d
```

#### Max Servers

Limit the maximum amount of servers to test to 10
```shell
./nameserver-sort.js -m 10
```

#### Filename

Use a custom filename 'test' for the output
```shell
./nameserver-sort.js -f test
```

#### Min. Replies

Use a custom amount of minimum replies, i.e. 25
```shell
./nameserver-sort.js -r 10
```

#### Timeout

Use a custom timeout, i.e. 10 seconds 
```shell
./nameserver-sort.js -t 10
```
